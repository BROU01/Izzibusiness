'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getCurriculumDay,
  CURRICULUM_TOTAL,
  PROMPT_HUB,
  type CurriculumDay,
} from '@/lib/curriculum';
import {
  useCompletedDays,
  isDayUnlocked,
  toggleDayCompleted,
  syncFromServer,
} from '@/lib/curriculum-progress';
import CompletionBurst from '@/components/CompletionBurst';

/**
 * Détail d'un jour du programme 20 jours.
 *
 * Accès protégé par le verrou séquentiel (jour N ouvert si jour N-1 complété).
 * Si le jour est verrouillé, l'écran reste honnête : on explique comment
 * ouvrir l'étape, sans montrer le contenu. Progression lue et écrite via
 * /api/program-progress (table program_progress, verrou vérifié côté serveur). La complétion
 * déclenche une salve de confettis CSS (désactivée en reduced-motion).
 */

const ACTIVITY_LABEL: Record<CurriculumDay['activity']['type'], string> = {
  video: 'Vidéo',
  lecture: 'Lecture',
  outil: 'Outil',
};

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timerRef = useRef<number | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      // Presse-papiers refusé (permissions, navigateur) : retour visuel
      // explicite — l'utilisateur peut toujours sélectionner le texte affiché.
      setState('failed');
    }
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState('idle'), 2500);
  }

  const label =
    state === 'copied'
      ? 'Copié'
      : state === 'failed'
        ? 'Copie impossible — sélectionne le texte'
        : 'Copier le prompt';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn ${state === 'copied' ? 'btn-ghost' : 'btn-secondary'} px-3 py-1.5 text-xs`}
      aria-live="polite"
    >
      {label}
    </button>
  );
}

function NotFoundCard() {
  return (
    <div className="card p-8 text-center">
      <p className="eyebrow">[ Jour introuvable ]</p>
      <h1 className="mt-2 font-serif text-3xl font-black">Ce jour n&apos;existe pas.</h1>
      <p className="mt-3 text-sm text-ink-60">
        Le programme comporte {CURRICULUM_TOTAL} jours, du 1 au {CURRICULUM_TOTAL}.
      </p>
      <Link href="/dashboard/onboarding/calendar" className="btn btn-primary mt-6">
        Revenir au calendrier
      </Link>
    </div>
  );
}

export default function DayDetailPage() {
  const params = useParams<{ day: string }>();
  const completed = useCompletedDays();

  const dayNumber = Number(params?.day);
  const dayData = getCurriculumDay(dayNumber);
  const isValidDay =
    dayData !== undefined && Number.isInteger(dayNumber) && String(dayData.day) === params?.day;

  // ── Hooks : TOUS appelés avant tout early return (rules-of-hooks) ──

  // Recharge la progression du compte depuis le serveur au montage.
  useEffect(() => {
    void syncFromServer();
  }, []);

  // Confettis : une salve par transition « non complété -> complété ».
  // dayData peut être undefined (jour invalide) : on dérive un booléen stable.
  const dayIsValid = Boolean(dayData && isValidDay);
  const isCompletedNow = dayIsValid && completed.includes(dayNumber);
  const wasCompleted = useRef(false);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (isCompletedNow && !wasCompleted.current) {
      // Microtask : évite le setState synchrone dans l'effet (règle lint).
      Promise.resolve().then(() => setBurst((n) => n + 1));
    }
    wasCompleted.current = isCompletedNow;
  }, [isCompletedNow]);

  // ── Early return après tous les hooks ──
  if (!dayData || !isValidDay) {
    return (
      <div className="mx-auto max-w-3xl">
        <NotFoundCard />
      </div>
    );
  }

  const unlocked = isDayUnlocked(dayData.day, completed);
  // Le modèle contient des blancs à remplir ? (change le microcopy et l'exemple)
  const hasBrackets = dayData.promptExample.prompt.includes('[');

  return (
    <div className="mx-auto max-w-3xl">
      {/* Salve de complétion (reduced-motion respecté) */}
      <CompletionBurst trigger={burst} active={burst > 0} />

      {/* Fil d'ariane */}
      <nav
        aria-label="Fil d'Ariane"
        className="mb-6 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wide"
      >
        <Link href="/dashboard" className="text-ink-60 hover:text-ink">
          Tableau de bord
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/dashboard/onboarding/calendar" className="text-ink-60 hover:text-ink">
          Programme 20 jours
        </Link>
        <span aria-hidden="true">/</span>
        <span>Jour {dayData.day}</span>
      </nav>

      {/* Jour verrouillé : écran honnête, sans contenu exposé */}
      {!unlocked && (
        <div className="card p-8">
          <p className="eyebrow">[ Jour {dayData.day} — verrouillé ]</p>
          <h1 className="mt-2 font-serif text-3xl font-black">Une étape à la fois.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-60">
            Termine l&apos;action du jour {dayData.day - 1} pour ouvrir cette étape. Tu progresses
            dans le bon ordre.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {dayData.day > 1 && (
              <Link
                href={`/dashboard/onboarding/calendar/${dayData.day - 1}`}
                className="btn btn-primary"
              >
                Reprendre le jour {dayData.day - 1}
              </Link>
            )}
            <Link href="/dashboard/onboarding/calendar" className="btn btn-ghost">
              Voir le calendrier
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-ink-60">
            {completed.length} / {CURRICULUM_TOTAL} jours complétés · progression de démonstration
            sur cet appareil
          </p>
        </div>
      )}

      {/* Jour accessible */}
      {unlocked && (
        <article>
          <p className="eyebrow">
            [ Jour {String(dayData.day).padStart(2, '0')} / {CURRICULUM_TOTAL} ]
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black md:text-5xl">{dayData.title}</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-wide text-ink-60">
            {dayData.skill} · ~{dayData.activity.durationMin} min au total
          </p>

          {/* Bandeau jour complété */}
          {completed.includes(dayData.day) && (
            <div className="card mt-6 bg-grass p-4">
              <p className="text-sm font-bold">
                Jour terminé · +{dayData.reward.xp} points
                {dayData.reward.badge && (
                  <span className="badge badge-acid ml-2">{dayData.reward.badge}</span>
                )}
              </p>
              <p className="mt-1 font-mono text-xs text-ink-70">
                Tu peux continuer vers la suite, ou décocher pour refaire l&apos;exercice.
              </p>
            </div>
          )}

          {/* Activité */}
          <section className="card mt-6" aria-labelledby="activity-title">
            <p className="eyebrow">Activité ({ACTIVITY_LABEL[dayData.activity.type]})</p>
            <h2 id="activity-title" className="mt-2 font-serif text-2xl font-bold">
              {dayData.activity.title}
            </h2>
            <p className="mt-2 font-mono text-xs text-ink-60">
              ~{dayData.activity.durationMin} min
            </p>
            {/* Contenu : mock. Le lecteur vidéo / le texte d'activité seront
                branchés sur la base. Aucun média fictif n'est affiché. */}
            <p className="mt-4 border-2 border-dashed border-ink/40 bg-paper-2 p-4 text-sm text-ink-60">
              Le contenu de cette activité sera disponible quand le programme sera branché sur les
              données de ton compte. En attendant, l&apos;exercice et le modèle de prompt ci-dessous
              sont exploitables dès maintenant.
            </p>
          </section>

          {/* Exercice + prompt */}
          <section className="card mt-6" aria-labelledby="exercise-title">
            <p className="eyebrow">Exercice du jour</p>
            <h2 id="exercise-title" className="mt-2 font-serif text-2xl font-bold">
              {dayData.exercise}
            </h2>

            <div className="mt-5 border-3 border-ink bg-ink p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-widest text-acid">
                  Modèle de prompt — {dayData.promptExample.site}
                </p>
                <CopyButton text={dayData.promptExample.prompt} />
              </div>
              <p className="mt-3 font-mono text-sm leading-relaxed text-paper">
                {dayData.promptExample.prompt}
              </p>
            </div>
            <p className="mt-2 font-mono text-xs text-ink-60">
              {hasBrackets
                ? 'Modèle à adapter : remplace chaque crochet [ ] par ta propre information.'
                : "Modèle prêt à l'emploi : copie-le tel quel, ou personnalise-le avec tes détails."}
            </p>

            {/* Mini-guide débutant : utiliser un prompt, pas à pas.
                Ouvert par défaut au jour 1, repliable ensuite. */}
            <details open={dayData.day === 1} className="mt-4 border-2 border-ink bg-paper-2">
              <summary className="cursor-pointer select-none px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest">
                Première fois avec une IA ? La méthode en 4 étapes
              </summary>

              <div className="border-t-2 border-ink px-4 py-4">
                <p className="text-sm leading-relaxed text-ink-70">
                  Un <strong>prompt</strong>, c&apos;est simplement le message que tu envoies à un
                  assistant IA (comme ChatGPT) pour obtenir de l&apos;aide. Ici, le message est déjà
                  écrit pour toi : tu le copies, tu le personnalises, et l&apos;IA fait le gros du
                  travail.
                </p>

                <ol className="mt-4 grid gap-3">
                  <li className="flex gap-3">
                    <span className="badge shrink-0">1</span>
                    <p className="text-sm leading-relaxed">
                      <strong>Copie le modèle.</strong> Utilise le bouton « Copier le prompt » juste
                      au-dessus.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className="badge shrink-0">2</span>
                    <p className="text-sm leading-relaxed">
                      <strong>Ouvre un assistant IA.</strong> Par exemple{' '}
                      <a
                        href="https://chatgpt.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline decoration-2 underline-offset-2"
                      >
                        ChatGPT
                      </a>
                      ,{' '}
                      <a
                        href="https://gemini.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline decoration-2 underline-offset-2"
                      >
                        Gemini
                      </a>{' '}
                      ou{' '}
                      <a
                        href="https://claude.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline decoration-2 underline-offset-2"
                      >
                        Claude
                      </a>
                      . Les trois sont gratuits et fonctionnent de la même façon.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className="badge shrink-0">3</span>
                    <p className="text-sm leading-relaxed">
                      <strong>Colle, puis remplace les crochets [ ].</strong> Chaque crochet est un
                      blanc à remplir avec tes informations. Exemple : au lieu de « pour [X] à
                      [ville/pays] », écris « pour mon service de tressage à Lomé ».
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className="badge shrink-0">4</span>
                    <p className="text-sm leading-relaxed">
                      <strong>Lis la réponse, puis ajuste.</strong> L&apos;IA propose, tu décides.
                      Si la réponse est à côté, reformule ta demande ou ajoute un détail sur ta
                      situation.
                    </p>
                  </li>
                </ol>

                <div className="rule my-4" />

                <p className="eyebrow">Les 3 mots à connaître</p>
                <ul className="mt-2 grid gap-2 text-sm leading-relaxed text-ink-70">
                  <li>
                    <strong>Prompt</strong> — le message que tu envoies à l&apos;IA. Plus il est
                    précis, plus la réponse est utile.
                  </li>
                  <li>
                    <strong>Crochets [ ]</strong> — les blancs à remplacer par tes informations
                    personnelles.
                  </li>
                  <li>
                    <strong>Le rôle (« Agis comme… »)</strong> — la première phrase indique à
                    l&apos;IA comment t&apos;aider. Garde-la telle quelle.
                  </li>
                </ul>
              </div>
            </details>

            <div className="rule my-5" />

            {/* Hub prompt engineering : ressources externes réelles */}
            <p className="eyebrow">Où trouver d&apos;autres modèles (optionnel)</p>
            <p className="mt-1 text-sm text-ink-60">
              Ces deux sites rassemblent des centaines de modèles de prompts prêts à l&apos;emploi.
              Ce n&apos;est pas obligatoire pour progresser : le modèle du jour suffit.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {PROMPT_HUB.map((r) => (
                <li key={r.name} className="border-2 border-ink/20 p-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold underline decoration-2 underline-offset-2"
                  >
                    {r.name}
                  </a>
                  <p className="mt-1 text-xs text-ink-60">{r.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Critère + complétion */}
          <section className="card mt-6 p-5" aria-label="Valider ce jour">
            <p className="eyebrow">Critère de validation</p>
            <p className="mt-2 text-sm">{dayData.validation}</p>
            <div className="rule my-4" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-serif text-lg font-bold">
                  {completed.includes(dayData.day)
                    ? 'Jour déjà terminé'
                    : `Récompense : +${dayData.reward.xp} points${
                        dayData.reward.badge ? ` · badge « ${dayData.reward.badge} »` : ''
                      }`}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-60">
                  {completed.includes(dayData.day)
                    ? "Tu peux décocher pour refaire l'exercice."
                    : 'Confirme que le critère de validation est atteint.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleDayCompleted(dayData.day)}
                className={`btn ${completed.includes(dayData.day) ? 'btn-ghost' : 'btn-primary'}`}
              >
                {completed.includes(dayData.day)
                  ? 'Marquer comme non terminé'
                  : 'Marquer ce jour comme terminé'}
              </button>
            </div>
          </section>

          {/* Navigation jours */}
          <nav
            aria-label="Navigation entre les jours"
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
          >
            {dayData.day > 1 ? (
              <Link
                href={`/dashboard/onboarding/calendar/${dayData.day - 1}`}
                className="btn btn-secondary"
              >
                Jour précédent ({dayData.day - 1})
              </Link>
            ) : (
              <span />
            )}
            {dayData.day < CURRICULUM_TOTAL ? (
              <Link
                href={`/dashboard/onboarding/calendar/${dayData.day + 1}`}
                className="btn btn-secondary"
                title={
                  isDayUnlocked(dayData.day + 1, completed)
                    ? undefined
                    : "Verrouillé — termine d'abord les jours précédents"
                }
              >
                Jour suivant ({dayData.day + 1})
              </Link>
            ) : (
              <Link href="/dashboard/onboarding/calendar" className="btn btn-primary">
                Terminer le parcours
              </Link>
            )}
          </nav>
        </article>
      )}
    </div>
  );
}
