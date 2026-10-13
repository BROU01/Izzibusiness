'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CURRICULUM_DAYS, CURRICULUM_TOTAL, type CurriculumDay } from '@/lib/curriculum';
import {
  useCompletedDays,
  useCompletionDates,
  computeStreak,
  syncFromSupabase,
  isSupabaseProgressEnabled,
  isDayUnlocked,
} from '@/lib/curriculum-progress';

/**
 * Calendrier du programme 20 jours.
 *
 * Progression : dual-mode via src/lib/curriculum-progress.ts —
 * localStorage en démo, table `program_progress` (RLS) en production.
 * Le streak (jours consécutifs) est calculé depuis les dates de complétion.
 *
 * Verrouillage séquentiel : le jour N est ouvert seulement si le jour N-1
 * est complété. Le microcopy du verrou est formulé positivement (voir brief).
 * La complétion d'un jour se fait sur sa page détail.
 */

const ACTIVITY_LABEL: Record<CurriculumDay['activity']['type'], string> = {
  video: 'Vidéo',
  lecture: 'Lecture',
  outil: 'Outil',
};

export default function CalendarPage() {
  const completed = useCompletedDays();
  const dates = useCompletionDates();
  const [openDay, setOpenDay] = useState<number | null>(null);

  // Mode production : recharge la progression distante au montage.
  useEffect(() => {
    if (isSupabaseProgressEnabled()) {
      void syncFromSupabase();
    }
  }, []);

  const streak = computeStreak(dates);
  const completedCount = completed.length;
  const progressPct = Math.round((completedCount / CURRICULUM_TOTAL) * 100);
  const nextDay = CURRICULUM_DAYS.find((d) => !completed.includes(d.day));

  function toggleDay(day: number) {
    setOpenDay((prev) => (prev === day ? null : day));
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ===== Masthead ===== */}
      <div className="rule" />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <p className="eyebrow">[ 00 ] — Programme 20 jours</p>
        <p className="font-mono text-xs text-ink-60">Un jour à la fois, dans l&apos;ordre</p>
      </div>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-[1.02] md:text-6xl">
        Ton parcours,
        <br />
        <span className="bg-acid px-1 box-decoration-clone">jour par jour</span>.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-ink-60">
        20 étapes courtes et concrètes : chaque jour, une activité, un exercice et un critère de
        validation clair. La complétion d&apos;un jour se fait sur sa page dédiée.
      </p>

      {/* ===== Progression + prochaine étape ===== */}
      <div className="card mt-10 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow">Ta progression</p>
          <p className="mt-1 font-serif text-2xl font-bold">
            {completedCount} / {CURRICULUM_TOTAL} jours terminés
          </p>
          {/* Barre : décorative, la valeur est dans le texte ci-dessus */}
          <div
            className="mt-3 h-3 w-full max-w-sm border-2 border-ink"
            role="presentation"
            aria-hidden="true"
          >
            <div className="h-full bg-grass" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        {/* Streak — jours consécutifs. Texte seul : la valeur est lisible
            sans interprétation (même logique que la barre de progression). */}
        <div className="border-l-0 md:border-l-3 md:pl-6" style={{ borderColor: 'var(--ink)' }}>
          <p className="eyebrow">Ton rythme</p>
          {streak > 0 ? (
            <p className="mt-1 font-serif text-lg font-bold">
              Série : {streak} jour{streak > 1 ? 's' : ''} d&apos;affilée
            </p>
          ) : (
            <p className="mt-1 font-serif text-lg font-bold text-ink-60">
              Complète un jour pour lancer ton rythme
            </p>
          )}
          <p className="mt-1 font-mono text-xs text-ink-60">
            Un jour par jour garde ta série active
          </p>
        </div>

        {nextDay && (
          <div className="border-l-0 md:border-l-3 md:pl-6" style={{ borderColor: 'var(--ink)' }}>
            <p className="eyebrow">Ta prochaine étape</p>
            <p className="mt-1 font-serif text-lg font-bold">
              Jour {nextDay.day} — {nextDay.title}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-60">
              ~{nextDay.activity.durationMin} min · {ACTIVITY_LABEL[nextDay.activity.type]}
            </p>
            <Link
              href={`/dashboard/onboarding/calendar/${nextDay.day}`}
              className="btn btn-primary mt-3"
            >
              Continuer le jour {nextDay.day}
            </Link>
          </div>
        )}
        {!nextDay && (
          <div className="border-l-0 md:border-l-3 md:pl-6" style={{ borderColor: 'var(--ink)' }}>
            <p className="eyebrow">Parcours terminé</p>
            <p className="mt-1 font-serif text-lg font-bold text-grass">
              Les 20 jours sont validés. Bien joué.
            </p>
            <Link href="/dashboard/missions" className="btn btn-primary mt-3">
              Consulter les missions disponibles
            </Link>
          </div>
        )}
      </div>

      {/* ===== Calendrier ===== */}
      <section aria-label="Les 20 jours du programme" className="mt-10">
        <ol className="grid gap-4 md:grid-cols-2">
          {CURRICULUM_DAYS.map((d) => {
            const done = completed.includes(d.day);
            const unlocked = isDayUnlocked(d.day, completed);
            const open = openDay === d.day;

            return (
              <li key={d.day} className="min-w-0">
                <article
                  className={`card ${done ? 'bg-grass' : unlocked ? 'bg-paper' : 'bg-paper-2'}`}
                  style={open ? { boxShadow: '10px 10px 0 var(--ink)' } : undefined}
                >
                  {/* En-tête cliquable */}
                  <button
                    type="button"
                    onClick={() => toggleDay(d.day)}
                    aria-expanded={open}
                    aria-controls={`day-panel-${d.day}`}
                    className="flex w-full min-w-0 items-center justify-between gap-4 text-left"
                  >
                    {' '}
                    <span className="flex min-w-0 flex-1 items-center gap-4">
                      <span
                        className={`font-mono text-4xl font-black ${done ? 'text-ink' : unlocked ? 'text-flame' : 'text-ink-60'}`}
                      >
                        {String(d.day).padStart(2, '0')}
                      </span>
                      <span>
                        <span className="block font-serif text-xl font-bold">{d.title}</span>
                        <span className="mt-0.5 block font-mono text-xs uppercase tracking-wide text-ink-60">
                          {d.skill} · ~{d.activity.durationMin} min
                        </span>
                      </span>
                    </span>
                    <span className={`badge shrink-0 ${done ? 'bg-ink text-paper' : ''}`}>
                      {done ? 'Terminé' : unlocked ? 'Disponible' : 'Verrouillé'}
                    </span>
                  </button>

                  {/* Panneau détaillé */}
                  {open && (
                    <div id={`day-panel-${d.day}`} className="mt-5 border-t-2 border-ink pt-4">
                      {!unlocked && (
                        <p className="border-2 border-ink bg-acid p-3 font-mono text-xs uppercase tracking-wide">
                          Termine l&apos;action du jour {d.day - 1} pour ouvrir cette étape. Tu
                          progresses dans le bon ordre.
                        </p>
                      )}

                      {unlocked && (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="eyebrow">
                                Activité ({ACTIVITY_LABEL[d.activity.type]})
                              </p>
                              <p className="mt-1 text-sm font-bold">{d.activity.title}</p>
                              <p className="font-mono text-xs text-ink-60">
                                ~{d.activity.durationMin} min
                              </p>
                            </div>
                            <div>
                              <p className="eyebrow">Récompense</p>
                              <p className="mt-1 text-sm">
                                +{d.reward.xp} points
                                {d.reward.badge && (
                                  <span className="badge badge-acid ml-2">{d.reward.badge}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                              href={`/dashboard/onboarding/calendar/${d.day}`}
                              className="btn btn-primary"
                            >
                              Ouvrir le jour {d.day}
                            </Link>
                            <Link href="/dashboard" className="btn btn-ghost">
                              Retour au tableau de bord
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>

        {/* Transparence mock */}
        <div className="card mt-10 bg-paper-2 p-5">
          <p className="eyebrow">[ Aperçu de démonstration ]</p>
          <p className="mt-2 max-w-3xl text-sm text-ink-60">
            Ce calendrier affiche le programme prévu et une progression de démonstration enregistrée
            sur cet appareil. La validation réelle des exercices, les points et les badges seront
            branchés sur les données de ton compte dans une prochaine étape.
          </p>
        </div>
      </section>
    </div>
  );
}
