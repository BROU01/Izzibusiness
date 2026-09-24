'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Formulaire de contact — la promesse « support humain » de l'accueil.
// Validation client (retour immédiat) + validation serveur (/api/contact).
// Client de noms : max 80, message max 2000 — alignés sur la table et l'API.

const NAME_MAX = 80;
const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;

const FAQ = [
  {
    q: "Combien coûte l'adhésion ?",
    a: '4 000 FCFA, paiement unique. Le montant est toujours affiché avant de confirmer un paiement — jamais de prélèvement caché.',
  },
  {
    q: 'Combien de temps prend un retrait ?',
    a: "Entre 1 et 24 heures vers ton compte mobile money. Le minimum est de 5 000 FCFA et des frais de 2 % s'appliquent, affichés avant confirmation.",
  },
  {
    q: "Est-ce que je vais gagner de l'argent ?",
    a: 'Personne ne peut te le garantir. La plateforme te donne des méthodes, des missions et des outils ; les résultats dépendent de ton activité.',
  },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');
  const [sentName, setSentName] = useState('');

  const nameCount = name.trim().length;
  const messageCount = message.trim().length;
  const canSubmit =
    status !== 'loading' &&
    nameCount >= 2 &&
    messageCount >= MESSAGE_MIN &&
    messageCount <= MESSAGE_MAX;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // Validation client (miroir du serveur)
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus('error');
      setFeedback("Cette adresse email n'a pas l'air valide.");
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });
      const data = (await response.json()) as { success?: boolean; message?: string };

      if (response.ok && data.success) {
        setStatus('success');
        setFeedback(data.message || 'Message envoyé !');
        setSentName(name.trim().split(' ')[0]);
      } else {
        setStatus('error');
        setFeedback(data.message || "Échec de l'envoi. Réessaie.");
      }
    } catch {
      setStatus('error');
      setFeedback('Erreur de connexion. Vérifie ta connexion et réessaie.');
    }
  }

  function resetForm() {
    setName('');
    setEmail('');
    setMessage('');
    setStatus('idle');
    setFeedback('');
    setSentName('');
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navbar />

      <section className="border-b-3 border-ink" aria-labelledby="contact-title">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/30 py-3 font-mono text-[11px] uppercase tracking-widest text-ink-60">
            <span>Support humain · Pas de robot</span>
            <span>Réponse sous quelques jours</span>
          </div>

          <div className="grid gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
            {/* ===== Colonne principale : formulaire ===== */}
            <div>
              <p className="eyebrow">[ Contact ]</p>
              <h1
                id="contact-title"
                className="mt-4 font-serif text-4xl font-black leading-[1.02] md:text-5xl"
              >
                Une question ? Écris-nous, une personne te répond.
              </h1>

              {status === 'success' ? (
                /* ===== État succès ===== */
                <div className="card mt-8 bg-paper p-6" role="status" aria-live="polite">
                  <p className="badge badge-grass">Envoyé ✓</p>
                  <h2 className="mt-4 font-serif text-2xl font-bold">
                    Merci {sentName}, ton message est parti.
                  </h2>
                  <p className="mt-2 leading-relaxed text-ink-70">{feedback}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={resetForm} className="btn btn-primary">
                      Envoyer un autre message
                    </button>
                    <Link href="/" className="btn btn-ghost">
                      Retour à l&apos;accueil
                    </Link>
                  </div>
                </div>
              ) : (
                /* ===== Formulaire ===== */
                <form onSubmit={handleSubmit} className="mt-8 grid gap-5" noValidate>
                  <label className="grid gap-1.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                      Ton nom *
                    </span>
                    <input
                      className="input"
                      type="text"
                      name="name"
                      autoComplete="name"
                      maxLength={NAME_MAX}
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Awa Diallo"
                      aria-describedby="name-counter"
                    />
                    <span
                      id="name-counter"
                      className="font-mono text-[11px] text-ink-60"
                      aria-live="polite"
                    >
                      {nameCount} / {NAME_MAX}
                    </span>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                      Email (optionnel)
                    </span>
                    <input
                      className="input"
                      type="email"
                      name="email"
                      autoComplete="email"
                      maxLength={120}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Pour recevoir la réponse par email"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                      Ton message *
                    </span>
                    <textarea
                      className="input resize-y"
                      name="message"
                      rows={6}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décris ta question : adhésion, retrait, formation…"
                      aria-describedby="message-counter"
                    />
                    <span
                      id="message-counter"
                      className="font-mono text-[11px] text-ink-60"
                      aria-live="polite"
                    >
                      {messageCount} / {MESSAGE_MAX}
                      {messageCount > 0 && messageCount < MESSAGE_MIN
                        ? ` — encore ${MESSAGE_MIN - messageCount} caractère(s) minimum`
                        : ''}
                    </span>
                    <span className="sr-only">
                      Entre {MESSAGE_MIN} et {MESSAGE_MAX} caractères.
                    </span>
                  </label>

                  {status === 'error' && (
                    <div
                      role="alert"
                      className="border-3 border-flame bg-flame/10 p-4 text-sm font-bold text-flame"
                    >
                      {feedback}
                    </div>
                  )}

                  <button type="submit" disabled={!canSubmit} className="btn btn-primary w-fit">
                    {status === 'loading' ? 'Envoi en cours…' : 'Envoyer mon message'}
                  </button>

                  <p className="font-mono text-[11px] leading-relaxed text-ink-60">
                    On ne te demandera jamais ton code mobile money ni ton mot de passe par message.
                    Ne partage jamais ces informations.
                  </p>
                </form>
              )}
            </div>

            {/* ===== Colonne latérale : réponses immédiates ===== */}
            <aside className="grid gap-6 self-start">
              <div className="card bg-paper-2 p-6">
                <p className="eyebrow">[ Réponses immédiates ]</p>
                <h2 className="mt-2 font-serif text-xl font-bold">
                  Les 3 questions les plus posées
                </h2>
                <dl className="mt-4 grid gap-4">
                  {FAQ.map((item) => (
                    <div key={item.q} className="border-t border-ink/20 pt-3">
                      <dt className="font-bold">{item.q}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-ink-60">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="card bg-paper p-6">
                <p className="eyebrow">[ Sécurité ]</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-70">
                  Le support ne demande jamais de payer par une autre voie que la plateforme, et ne
                  te contacte pas en premier pour te demander des informations de paiement. Un doute
                  ? Envoie-nous le message suspect ici.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
