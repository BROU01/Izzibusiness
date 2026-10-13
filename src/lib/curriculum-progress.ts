import { useSyncExternalStore } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

/**
 * Progression du programme 20 jours — DUAL MODE.
 *
 * Mode démo (Supabase non configuré) : localStorage, clé
 * "izzibusiness-20d-progress" — JSON { [day]: ISO date de complétion }.
 * L'horodatage permet le calcul du streak ; sans backend, c'est le seul
 * stockage possible.
 *
 * Mode production (Supabase configuré) : table `program_progress`
 * (migration 005) via le client navigateur, protégée par RLS — la
 * progression survit au nettoyage du navigateur et suit le compte.
 *
 * Les deux pages (calendrier et détail d'un jour) partagent ce module
 * pour rester synchronisées.
 */

const PROGRESS_KEY = 'izzibusiness-20d-progress';
const PROGRESS_EVENT = 'izzibusiness-20d-progress-changed';
const EMPTY_COMPLETED: number[] = [];
const EMPTY_DATES: Record<number, string> = {};

/** Format stocké : jour -> date ISO de complétion (pour le streak). */
type ProgressMap = Record<number, string>;

/** Cache module : getSnapshot doit renvoyer une référence stable entre rendus. */
let cachedMap: ProgressMap | null = null;
let cachedCompleted: number[] | null = null;
/** Invalidation en attente (écriture Supabase en cours → relecture). */
let supabaseSync: Promise<void> | null = null;

export function isSupabaseProgressEnabled(): boolean {
  return getSupabasePublicEnv() !== null;
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

function readLocal(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    // Migration du format ancien (array de nombres sans dates).
    if (Array.isArray(parsed)) return {};
    const map: ProgressMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const day = Number(key);
      if (Number.isInteger(day) && day >= 1 && day <= 20 && typeof value === 'string') {
        map[day] = value;
      }
    }
    return map;
  } catch {
    return {};
  }
}

/** Ancien format (array de nombres) : converti une fois vers le nouveau. */
function migrateLegacyArray(): ProgressMap | null {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw || !raw.trim().startsWith('[')) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const now = new Date().toISOString();
    const map: ProgressMap = {};
    for (const n of parsed) {
      if (typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 20) {
        map[n] = now;
      }
    }
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
    return map;
  } catch {
    return null;
  }
}

function getMapSnapshot(): ProgressMap {
  if (cachedMap === null) {
    cachedMap = migrateLegacyArray() ?? readLocal();
  }
  return cachedMap;
}

function getCompletedSnapshot(): number[] {
  if (cachedCompleted === null) {
    cachedCompleted = Object.keys(getMapSnapshot())
      .map(Number)
      .sort((a, b) => a - b);
  }
  return cachedCompleted;
}

function getServerSnapshot(): number[] {
  return EMPTY_COMPLETED;
}

function subscribe(onChange: () => void): () => void {
  // Autre onglet : le cache est invalidé avant notification.
  const onStorage = () => {
    cachedMap = null;
    cachedCompleted = null;
    onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(PROGRESS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(PROGRESS_EVENT, onChange);
  };
}

/**
 * Hook : liste des jours complétés, synchronisée entre onglets.
 * En mode Supabase, la lecture distante est déclenchée au premier usage
 * (dans un effet du composant via `syncFromSupabase`) — le hook reste
 * synchroné sur le cache local qui est re-notifié après réponse.
 */
export function useCompletedDays(): number[] {
  return useSyncExternalStore(subscribe, getCompletedSnapshot, getServerSnapshot);
}

/** Dates de complétion par jour (pour le streak). */
export function useCompletionDates(): Record<number, string> {
  return useSyncExternalStore(
    subscribe,
    () => getMapSnapshot(),
    () => EMPTY_DATES,
  );
}

// ---------------------------------------------------------------------------
// Sync Supabase (mode production uniquement)
// ---------------------------------------------------------------------------

/**
 * Recharge la progression depuis Supabase dans le cache local.
 * Appelé au montage des pages du programme (mode production).
 */
export async function syncFromSupabase(): Promise<void> {
  if (!isSupabaseProgressEnabled() || supabaseSync) return;

  supabaseSync = (async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from('program_progress').select('day, completed_at');

      if (error || !data) return;

      const remote: ProgressMap = {};
      for (const row of data) {
        if (typeof row.day === 'number' && typeof row.completed_at === 'string') {
          remote[row.day] = row.completed_at;
        }
      }

      // Fusion : le distant fait foi (le local n'est qu'un miroir démo).
      cachedMap = remote;
      cachedCompleted = null;
      window.dispatchEvent(new Event(PROGRESS_EVENT));
    } catch {
      // Réseau indisponible : on garde le cache local.
    } finally {
      supabaseSync = null;
    }
  })();

  return supabaseSync;
}

/**
 * Marque un jour comme complété (ou le retire), persiste, notifie.
 * Mode démo : localStorage. Mode production : table Supabase + miroir local.
 */
export async function toggleDayCompleted(day: number): Promise<void> {
  const current = getMapSnapshot();
  const isCompleted = day in current;

  // Mise à jour optimiste locale (réponse instantanée, feedback confettis).
  const updated: ProgressMap = { ...current };
  if (isCompleted) {
    delete updated[day];
  } else {
    updated[day] = new Date().toISOString();
  }
  cachedMap = updated;
  cachedCompleted = null;

  if (!isSupabaseProgressEnabled()) {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
    } catch {
      // Stockage indisponible (navigation privée) : acceptable en démo.
    }
    window.dispatchEvent(new Event(PROGRESS_EVENT));
    return;
  }

  window.dispatchEvent(new Event(PROGRESS_EVENT));

  try {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (isCompleted) {
      await supabase.from('program_progress').delete().eq('user_id', user.id).eq('day', day);
    } else {
      // La contrainte unique est (user_id, day) : user_id doit être fourni (RLS).
      await supabase
        .from('program_progress')
        .upsert(
          { user_id: user.id, day, completed_at: updated[day] },
          { onConflict: 'user_id,day' },
        );
    }
  } catch {
    // Échec réseau : le miroir local garde l'état optimiste ; la prochaine
    // syncFromSupabase réalignera. Pas de blocage de l'UI pour autant.
  }
}

// ---------------------------------------------------------------------------
// Streak — jours consécutifs
// ---------------------------------------------------------------------------

/**
 * Calcule le streak actuel depuis les dates de complétion.
 * Règle : une suite de complétions dont chaque date est antérieure ou égale
 * au lendemain de la précédente forme un streak. Le streak courant reste
 * "vivant" si la dernière complétion date d'aujourd'hui ou d'hier.
 */
export function computeStreak(dates: Record<number, string>): number {
  const days = Object.entries(dates)
    .map(([day, iso]) => ({ day: Number(day), date: new Date(iso) }))
    .filter((d) => !Number.isNaN(d.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (days.length === 0) return 0;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  // Regroupe les suites consécutives ; garde la longueur du groupe qui
  // inclut aujourd'hui ou hier (streak "vivant").
  const today = startOfDay(new Date());
  let streak = 0;
  let prev: number | null = null;
  let lastDate: number | null = null;

  for (const { date } of days) {
    const cur = startOfDay(date);
    if (prev !== null && cur - prev <= DAY_MS) {
      streak += 1;
    } else {
      streak = 1;
    }
    prev = cur;
    lastDate = cur;
  }

  // Streak mort : dernière complétion plus vieille qu'hier.
  if (lastDate !== null && today - lastDate > 2 * DAY_MS) return 0;

  return streak;
}

/** Le jour N est ouvert seulement si le jour N-1 est complété (jour 1 ouvert). */
export function isDayUnlocked(day: number, completed: number[]): boolean {
  return day === 1 || completed.includes(day - 1);
}
