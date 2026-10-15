import { useSyncExternalStore } from 'react';

/**
 * Progression du programme 20 jours.
 *
 * Source de vérité : table `program_progress`, lue et modifiée via
 * `/api/program-progress` (session vérifiée côté serveur, verrou séquentiel
 * appliqué en SQL). Ce module garde un cache mémoire partagé par les deux
 * pages (calendrier et détail d'un jour) pour qu'elles restent synchronisées,
 * et applique une mise à jour optimiste au clic, réalignée sur la réponse
 * du serveur.
 *
 * Pas de persistance localStorage : la progression suit le compte, pas le
 * navigateur (et ne fuit pas d'un compte à l'autre sur un appareil partagé).
 */

const PROGRESS_EVENT = 'izzibusiness-20d-progress-changed';
const PROGRESS_ENDPOINT = '/api/program-progress';
const EMPTY_COMPLETED: number[] = [];
const EMPTY_DATES: Record<number, string> = {};

/** Format en cache : jour -> date ISO de complétion (pour le streak). */
type ProgressMap = Record<number, string>;

/** Cache module : getSnapshot doit renvoyer une référence stable entre rendus. */
let cachedMap: ProgressMap = EMPTY_DATES;
let cachedCompleted: number[] | null = null;
/** Lecture distante en cours (évite les requêtes en double au montage). */
let pendingSync: Promise<void> | null = null;

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

function setCache(map: ProgressMap): void {
  cachedMap = map;
  cachedCompleted = null;
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

function getMapSnapshot(): ProgressMap {
  return cachedMap;
}

function getCompletedSnapshot(): number[] {
  if (cachedCompleted === null) {
    cachedCompleted = Object.keys(cachedMap)
      .map(Number)
      .sort((a, b) => a - b);
  }
  return cachedCompleted;
}

function getServerSnapshot(): number[] {
  return EMPTY_COMPLETED;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(PROGRESS_EVENT, onChange);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, onChange);
  };
}

/**
 * Hook : liste des jours complétés (cache partagé). La lecture distante est
 * déclenchée au montage des pages via `syncFromServer`.
 */
export function useCompletedDays(): number[] {
  return useSyncExternalStore(subscribe, getCompletedSnapshot, getServerSnapshot);
}

/** Dates de complétion par jour (pour le streak). */
export function useCompletionDates(): Record<number, string> {
  return useSyncExternalStore(subscribe, getMapSnapshot, () => EMPTY_DATES);
}

// ---------------------------------------------------------------------------
// Serveur
// ---------------------------------------------------------------------------

/** Extrait `{ data: { days: [{ day, completedAt }] } }` d'une réponse API. */
function parseDays(payload: unknown): ProgressMap | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const days = (data as { days?: unknown }).days;
  if (!Array.isArray(days)) return null;

  const map: ProgressMap = {};
  for (const entry of days) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { day, completedAt } = entry as { day?: unknown; completedAt?: unknown };
    if (
      typeof day === 'number' &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= 20 &&
      typeof completedAt === 'string'
    ) {
      map[day] = completedAt;
    }
  }
  return map;
}

async function readProgressResponse(response: Response): Promise<ProgressMap | null> {
  if (!response.ok) return null;
  try {
    return parseDays(await response.json());
  } catch {
    return null;
  }
}

/**
 * Recharge la progression depuis le serveur dans le cache partagé.
 * Appelé au montage des pages du programme.
 */
export async function syncFromServer(): Promise<void> {
  if (pendingSync) return pendingSync;

  pendingSync = (async () => {
    try {
      const response = await fetch(PROGRESS_ENDPOINT, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const remote = await readProgressResponse(response);
      if (remote) setCache(remote);
    } catch {
      // Réseau indisponible : on garde le cache courant.
    } finally {
      pendingSync = null;
    }
  })();

  return pendingSync;
}

/**
 * Marque un jour comme complété (ou le retire) : mise à jour optimiste,
 * puis bascule côté serveur. Le cache est réaligné sur la réponse (ou relu
 * en cas d'échec, ce qui annule l'état optimiste).
 */
export async function toggleDayCompleted(day: number): Promise<void> {
  const current = cachedMap;
  const updated: ProgressMap = { ...current };
  if (day in current) {
    delete updated[day];
  } else {
    updated[day] = new Date().toISOString();
  }
  setCache(updated);

  try {
    const response = await fetch(PROGRESS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ day }),
    });
    const remote = await readProgressResponse(response);
    if (remote) {
      setCache(remote);
      return;
    }
  } catch {
    // Échec réseau : relecture ci-dessous.
  }
  // Refus (jour verrouillé, session expirée) ou réseau : on se réaligne.
  setCache(current);
  await syncFromServer();
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
