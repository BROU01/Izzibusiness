'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CourseImage from '@/components/CourseImage';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { formatFcfa, ADHESION_FEE } from '@/lib/config';
import { createBrowserClient } from '@/lib/supabase/client';

type Course = {
  slug: string;
  title: string;
  description: string;
  duration_weeks: number;
  price_fcfa: number;
  level: string;
  category: string;
  image_url: string | null;
};

export default function FormationsPage() {
  const { user } = useSession();
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);
  const [formData, setFormData] = useState({
    nomComplet: '',
    contact: '',
    objectif: '',
    niveau: 'debutant',
    formation: '',
    paiement: 'orange',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');

  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase.from('courses').select('*');
        if (error || cancelled || !Array.isArray(data)) return;
        const rows = data as Array<Record<string, unknown>>;
        setCourses(
          rows
            .filter((row) => typeof row.slug === 'string' && typeof row.title === 'string')
            .map((row) => ({
              slug: String(row.slug),
              title: String(row.title),
              description: typeof row.description === 'string' ? row.description : '',
              duration_weeks: typeof row.duration_weeks === 'number' ? row.duration_weeks : 1,
              price_fcfa: typeof row.price_fcfa === 'number' ? row.price_fcfa : 0,
              level: typeof row.level === 'string' ? row.level : 'debutant',
              category: typeof row.category === 'string' ? row.category : '',
              image_url: typeof row.image_url === 'string' ? row.image_url : null,
            })),
        );
      } catch {
        // Table absente ou réseau indisponible : on garde les formations hardcodées.
      }
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const allFormations = useMemo(
    () => [
      ...courses.map((c: Course) => ({
        id: c.slug,
        title: c.title,
        desc: c.description,
        duration: c.duration_weeks > 1 ? `${c.duration_weeks} semaines` : '1 semaine',
        price: c.price_fcfa,
        level: c.level === 'debutant' ? 'Débutant' : 'Intermédiaire',
        featured: false,
        category: c.category,
        color: 'var(--acid)',
        image: c.image_url ?? '/images/courses/default.svg',
      })),
      {
        id: 'montage-video',
        title: 'Montage vidéo Pro',
        desc: 'Crée des vidéos virales pour TikTok, YouTube et Instagram. CapCut, rushes, sous-titres, hooks et techniques de rétention.',
        duration: '3 semaines',
        price: 5000,
        level: 'Débutant',
        featured: true,
        category: 'Création de contenu',
        color: 'var(--flame)',
        image: '/images/courses/montage-video.svg',
      },
      {
        id: 'assistant-virtuel',
        title: 'Assistant Virtuel',
        desc: "Deviens assistant virtuel pour des clients internationaux. Gestion d'agenda, emails, réseaux sociaux et rémunération en $.",
        duration: '2 semaines',
        price: 3500,
        level: 'Débutant',
        featured: false,
        category: 'Freelance',
        color: 'var(--sky)',
        image: '/images/courses/va.svg',
      },
      {
        id: 'smm',
        title: 'Social Media Manager',
        desc: 'Gère les réseaux sociaux de marques et gagne régulièrement. Stratégie, calendrier, création de contenu et community management.',
        duration: '4 semaines',
        price: 7500,
        level: 'Intermédiaire',
        featured: true,
        category: 'Marketing',
        color: 'var(--grass)',
        image: '/images/courses/smm.svg',
      },
      {
        id: 'growth-hacking',
        title: 'Growth Hacking',
        desc: 'Techniques avancées de croissance pour startups et entreprises. Funnels, acquisition, rétention et monétisation.',
        duration: '3 semaines',
        price: 6500,
        level: 'Avancé',
        featured: false,
        category: 'Marketing',
        color: 'var(--acid)',
        image: '/images/courses/growth.svg',
      },
      {
        id: 'ia',
        title: 'Intelligence Artificielle',
        desc: "Maîtrise l'IA pour booster ta productivité et créer des services à vendre. ChatGPT, automatisations, prompts et plus.",
        duration: '3 semaines',
        price: 7500,
        level: 'Intermédiaire',
        featured: true,
        category: 'IA & Tech',
        color: 'var(--flame)',
        image: '/images/courses/ia.svg',
      },
      {
        id: 'cybersécurité',
        title: 'Cybersécurité',
        desc: "Protège les systèmes d'information et lance-toi dans un domaine très demandé et bien rémunéré.",
        duration: '5 semaines',
        price: 10000,
        level: 'Avancé',
        featured: false,
        category: 'IA & Tech',
        color: 'var(--sky)',
        image: '/images/courses/cyber.svg',
      },
      {
        id: 'design',
        title: 'Design Graphique',
        desc: 'Crée des visuels pro pour marques et entreprises. Canva, Photoshop, identité visuelle et réseaux sociaux.',
        duration: '3 semaines',
        price: 5500,
        level: 'Débutant',
        featured: false,
        category: 'Design',
        color: 'var(--grass)',
        image: '/images/courses/design.svg',
      },
      {
        id: 'branding',
        title: 'Branding & Identité Visuelle',
        desc: 'Construis des marques mémorables. Logos, chartes graphiques, stratégie de marque et positionnement.',
        duration: '3 semaines',
        price: 6000,
        level: 'Intermédiaire',
        featured: false,
        category: 'Design',
        color: 'var(--acid)',
        image: '/images/courses/branding.svg',
      },
      {
        id: 'e-com',
        title: 'E-commerce',
        desc: 'Lance ta boutique en ligne et génère des ventes. Shopify, publicités, logistique et stratégies de vente.',
        duration: '4 semaines',
        price: 8000,
        level: 'Intermédiaire',
        featured: false,
        category: 'Business',
        color: 'var(--flame)',
        image: '/images/courses/ecom.svg',
      },
      {
        id: 'immo',
        title: 'Immobilier',
        desc: "Investis dans l'immobilier avec un budget limité. Techniques de finding, négociation et rentabilité.",
        duration: '3 semaines',
        price: 7000,
        level: 'Avancé',
        featured: false,
        category: 'Business',
        color: 'var(--sky)',
        image: '/images/courses/immo.svg',
      },
      {
        id: 'bourse',
        title: 'Bourse & Trading',
        desc: 'Apprends à investir en bourse et trader. Analyse technique, gestion des risques et stratégie.',
        duration: '4 semaines',
        price: 9000,
        level: 'Avancé',
        featured: false,
        category: 'Business',
        color: 'var(--grass)',
        image: '/images/courses/bourse.svg',
      },
      {
        id: 'crypto',
        title: 'Crypto-monnaies',
        desc: "Comprends et investis dans les cryptos. Blockchain, wallet, DeFi, NFT et stratégies d'investissement.",
        duration: '2 semaines',
        price: 4500,
        level: 'Débutant',
        featured: false,
        category: 'Business',
        color: 'var(--acid)',
        image: '/images/courses/crypto.svg',
      },
      {
        id: 'dropshipping',
        title: 'Dropshipping',
        desc: 'Crée une boutique sans stock. Trouve des produits gagnants, publicités et automatisation des commandes.',
        duration: '3 semaines',
        price: 6000,
        level: 'Débutant',
        featured: false,
        category: 'Business',
        color: 'var(--flame)',
        image: '/images/courses/dropshipping.svg',
      },
      {
        id: 'affiliation',
        title: "Marketing d'Affiliation",
        desc: "Gagne de l'argent en recommandant des produits. Choix d'offres, audience, tunnels de vente et commmissions.",
        duration: '2 semaines',
        price: 4000,
        level: 'Débutant',
        featured: false,
        category: 'Marketing',
        color: 'var(--sky)',
        image: '/images/courses/affiliation.svg',
      },
      {
        id: 'copywriting',
        title: 'Copywriting',
        desc: 'Écris des textes qui vendent. Accroches, pages de vente, emails publicitaires et storytelling.',
        duration: '2 semaines',
        price: 4500,
        level: 'Débutant',
        featured: false,
        category: 'Création de contenu',
        color: 'var(--grass)',
        image: '/images/courses/copy.svg',
      },
      {
        id: 'vj',
        title: 'VJing & Mix Audio-Visuel',
        desc: "Perfectionne tes compétences en mix et VJing pour te démarquer dans l'industrie.",
        duration: '3 semaines',
        price: 5500,
        level: 'Intermédiaire',
        featured: false,
        category: 'Création de contenu',
        color: 'var(--acid)',
        image: '/images/courses/vj.svg',
      },
      {
        id: 'cyberia',
        title: 'CyberIA — Sécurité & IA',
        desc: "La cybersécurité augmentée par l'IA. Défense proactive, détection d'anomalies et response automatisée.",
        duration: '6 semaines',
        price: 12000,
        level: 'Avancé',
        featured: true,
        category: 'IA & Tech',
        color: 'var(--flame)',
        image: '/images/courses/cyberia.svg',
      },
      {
        id: 'clinquant',
        title: 'Clinquant — Tu deviens riche',
        desc: 'Le programme complet pour construire ta richesse. Investissement, business, mindset et gestion financière.',
        duration: '8 semaines',
        price: 10000,
        level: 'Débutant',
        featured: true,
        category: 'Business',
        color: 'var(--sky)',
        image: '/images/courses/clinquant.svg',
      },
    ],
    [courses],
  );

  const visibleFormations = showAll ? allFormations : allFormations.slice(0, 6);

  // L'accès aux formations passe par l'adhésion, réglée depuis le wallet
  // (PayDunya ou solde).
  const goToMembership = () => {
    router.push(user ? '/dashboard/wallet' : '/login?redirect=/dashboard/wallet');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    setFormMessage('');

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.from('course_registrations').insert({
        user_id: user?.id ?? null,
        full_name: formData.nomComplet,
        phone: formData.contact,
        goal: formData.objectif,
        level: formData.niveau,
        formation: formData.formation,
        payment_method: formData.paiement,
      });

      if (error) throw error;

      setFormStatus('success');
      setFormMessage(
        'Demande envoyée ! Notre équipe vous contacte sous 24h pour finaliser votre inscription.',
      );
      setFormData({
        nomComplet: '',
        contact: '',
        objectif: '',
        niveau: 'debutant',
        formation: '',
        paiement: 'orange',
      });
    } catch {
      setFormStatus('error');
      setFormMessage("Erreur lors de l'envoi. Réessayez ou contactez-nous sur WhatsApp.");
    }
  };

  // Preuves produit vérifiables — aucune donnée d'usage fictive.
  // Nombre de formations = allFormations.length (calculé après chargement).
  const stats = [
    { value: String(allFormations.length), label: 'Formations publiées' },
    { value: '1×', label: `Paiement unique — ${formatFcfa(ADHESION_FEE)}` },
    { value: '∞', label: 'Accès à vie au catalogue' },
    { value: '24/7', label: 'Support accessible' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* ═══ MASTHEAD ═══ */}
      <header className="border-b-[3px]" style={{ borderColor: 'var(--ink)' }}>
        <div className="container">
          <div
            className="flex items-center justify-between py-2 text-[11px] font-medium border-b"
            style={{ borderColor: 'var(--ink)', fontFamily: 'var(--font-body)' }}
          >
            <span>IZIBUSINESS ACADEMY</span>
            <span className="hidden sm:inline">FORMATIONS PROFESSIONNELLES</span>
            <span>ÉDITION {new Date().getFullYear()}</span>
          </div>

          <div className="grid gap-8 py-10 md:grid-cols-[1.4fr_1fr] md:py-14">
            <div>
              <p className="eyebrow mb-4">[ 00 ] FORMATIONS</p>
              <h1
                className="font-semibold uppercase leading-[0.85] tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,7vw,5rem)' }}
              >
                Apprends un
                <br />
                <span style={{ color: 'var(--flame)' }}>métier</span> qui paie.
              </h1>
              <p
                className="mt-5 max-w-xl text-[15px] leading-relaxed"
                style={{ color: 'var(--ink-70)' }}
              >
                {allFormations.length} formations en ligne, adhésion unique à{' '}
                {formatFcfa(ADHESION_FEE)}, accès à vie. Un parcours structuré avec activités,
                exercices et progression visible.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={goToMembership} className="btn btn-primary">
                  Voir ce que contient l&apos;adhésion
                </button>
                <a href="#inscription-formation" className="btn btn-secondary">
                  S&apos;inscrire gratuitement
                </a>
              </div>
              <p className="mt-3 font-mono text-xs" style={{ color: 'var(--ink-70)' }}>
                Aucun paiement n&apos;est déclenché à cette étape · Tu verras le détail avant de
                confirmer
              </p>
            </div>

            <div className="self-end">
              <div className="card" style={{ background: 'var(--acid)' }}>
                <div className="rule mb-4" />
                <p className="eyebrow mb-3">[ CHIFFRES ]</p>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <div
                        className="text-3xl font-semibold leading-none"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {s.value}
                      </div>
                      <div
                        className="mt-1 text-[11px] uppercase"
                        style={{ color: 'var(--ink-70)' }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rule mt-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ═══ 01 — FORMATIONS ═══ */}
        <section className="section">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="eyebrow">[ 01 ] CATALOGUE</p>
                <h2 className="heading-lg mt-2">Nos formations</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="#inscription-formation" className="btn btn-primary">
                  S&apos;inscrire à une formation
                </a>
                <button onClick={goToMembership} className="btn btn-secondary">
                  Adhérer — {formatFcfa(ADHESION_FEE)}
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {visibleFormations.map((f) => (
                <article key={f.id} className="card flex flex-col">
                  <div
                    className="flex items-center justify-between px-3 py-1.5 border-b-[3px] text-[11px] font-medium uppercase"
                    style={{ background: f.color, color: 'var(--ink)', borderColor: 'var(--ink)' }}
                  >
                    <span>{f.category}</span>
                    <span>{f.duration}</span>
                  </div>

                  {/* Placeholder volontaire : les visuels réels ne sont pas
                      encore produits (voir CourseImage). */}
                  <CourseImage title={f.title} image={f.image} accent={f.color} />

                  <div className="p-5 flex flex-col flex-1">
                    <span
                      className="badge mb-3 self-start"
                      style={{ background: 'var(--paper)', borderColor: 'var(--ink)' }}
                    >
                      {f.level}
                    </span>

                    <h3
                      className="text-xl font-semibold uppercase leading-[1.05]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {f.title}
                    </h3>

                    <p
                      className="mt-3 text-[13.5px] leading-relaxed flex-1"
                      style={{ color: 'var(--ink-70)' }}
                    >
                      {f.desc}
                    </p>

                    <div
                      className="mt-4 flex items-baseline justify-between border-t pt-3"
                      style={{ borderColor: 'var(--ink)' }}
                    >
                      <span
                        className="text-2xl font-semibold"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {formatFcfa(f.price)}
                      </span>
                      <span className="text-[11px] uppercase" style={{ color: 'var(--ink-70)' }}>
                        / formation
                      </span>
                    </div>

                    <button onClick={goToMembership} className="btn btn-primary w-full mt-4">
                      Adhérer et suivre cette formation
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {allFormations.length > 6 && (
              <div className="mt-8 flex justify-center">
                <button onClick={() => setShowAll(!showAll)} className="btn btn-secondary">
                  {showAll ? 'Voir moins' : `Voir les ${allFormations.length} formations`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ═══ 02 — BANDEAU ═══ */}
        <section
          className="border-y-[3px]"
          style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}
        >
          <div className="container py-10 text-center">
            <p className="eyebrow" style={{ color: 'var(--acid)' }}>
              [ 02 ] ABONNEMENT
            </p>
            <p
              className="mx-auto mt-3 max-w-3xl text-xl font-medium uppercase leading-snug md:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Un seul paiement — {formatFcfa(ADHESION_FEE)} — accès à vie à toutes les formations
            </p>
            <button
              onClick={goToMembership}
              className="btn btn-primary mt-6"
              style={{ background: 'var(--acid)', color: 'var(--ink)' }}
            >
              Voir le détail de l&apos;adhésion
            </button>
            <p className="mt-3 font-mono text-xs" style={{ color: 'rgb(245 241 230 / 0.6)' }}>
              Le détail de ce qui est inclus s&apos;affiche avant toute confirmation de paiement.
            </p>
          </div>
        </section>

        {/* ═══ 03 — INSCRIPTION ═══ */}
        <section id="inscription-formation" className="section">
          <div className="container grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow">[ 03 ] INSCRIPTION</p>
              <h2 className="heading-lg mt-2">
                Ce que tu obtiens,
                <br />
                en clair.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--ink-70)' }}>
                Inscris-toi pour accéder aux formations dès aujourd&apos;hui. Notre équipe te
                contacte sous 24h pour finaliser ton inscription.
              </p>

              <div className="card mt-6" style={{ background: 'var(--acid)' }}>
                <p className="eyebrow mb-2">[ ABONNEMENT ]</p>
                <p
                  className="text-4xl font-semibold leading-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {formatFcfa(ADHESION_FEE)}
                </p>
                <p className="mt-2 text-[12px] uppercase" style={{ color: 'var(--ink-70)' }}>
                  Paiement unique — accès à vie
                </p>
                <div className="rule my-4" />
                <ul className="space-y-2 text-[13px]">
                  <li>18 formations professionnelles</li>
                  <li>Accès aux missions payées</li>
                  <li>Communauté privée</li>
                  <li>Certificats de réussite</li>
                </ul>
              </div>
            </div>

            <div>
              <form className="card" onSubmit={handleFormSubmit}>
                <div className="rule mb-4" />
                <p className="eyebrow mb-4">[ FORMULAIRE D&apos;INSCRIPTION ]</p>

                <div className="grid gap-4">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium uppercase">Nom complet *</span>
                    <input
                      type="text"
                      required
                      value={formData.nomComplet}
                      onChange={(e) => setFormData({ ...formData, nomComplet: e.target.value })}
                      className="input"
                      placeholder="Ex: Awa Diallo"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium uppercase">Contact (WhatsApp) *</span>
                    <input
                      type="tel"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="input"
                      placeholder="+229 XX XX XX XX"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium uppercase">Objectif principal *</span>
                    <textarea
                      required
                      rows={3}
                      value={formData.objectif}
                      onChange={(e) => setFormData({ ...formData, objectif: e.target.value })}
                      className="input resize-none"
                      placeholder="Ex: Gagner de l'argent en ligne, changer de carrière..."
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium uppercase">Niveau actuel</span>
                    <select
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                      className="input"
                    >
                      <option value="debutant">Débutant complet</option>
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="avance">Avancé</option>
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium uppercase">Formation souhaitée *</span>
                    <select
                      required
                      value={formData.formation}
                      onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
                      className="input"
                    >
                      <option value="">-- Choisir une formation --</option>
                      {allFormations.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title} ({formatFcfa(f.price)})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium uppercase">Méthode de paiement</span>
                    <select
                      value={formData.paiement}
                      onChange={(e) => setFormData({ ...formData, paiement: e.target.value })}
                      className="input"
                    >
                      <option value="orange">Orange Money</option>
                      <option value="mtn">MTN MoMo</option>
                      <option value="moov">Moov Money</option>
                      <option value="wave">Wave</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={formStatus === 'loading'}
                    className="btn btn-primary w-full"
                  >
                    {formStatus === 'loading' ? 'Envoi en cours...' : 'Envoyer ma demande'}
                  </button>

                  {formStatus === 'success' && (
                    <div
                      className="border-[3px] p-3 text-[13px]"
                      style={{
                        borderColor: 'var(--grass)',
                        background: 'rgba(0,168,107,0.12)',
                        color: 'var(--grass)',
                      }}
                    >
                      {formMessage}
                    </div>
                  )}
                  {formStatus === 'error' && (
                    <div
                      className="border-[3px] p-3 text-[13px]"
                      style={{
                        borderColor: 'var(--flame)',
                        background: 'rgba(255,77,28,0.12)',
                        color: 'var(--flame)',
                      }}
                    >
                      {formMessage}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* ═══ 04 — CTA ═══ */}
        <section
          className="border-t-[3px]"
          style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}
        >
          <div className="container py-14 text-center">
            <p className="eyebrow" style={{ color: 'var(--acid)' }}>
              [ 04 ] COMMENCER
            </p>
            <h2
              className="mx-auto mt-3 max-w-3xl font-semibold uppercase leading-[0.9]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.5rem)' }}
            >
              Ta première compétence commence maintenant
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={goToMembership}
                className="btn btn-primary"
                style={{ background: 'var(--acid)', color: 'var(--ink)' }}
              >
                Commencer l&apos;adhésion — {formatFcfa(ADHESION_FEE)}
              </button>
              <Link href="/contact" className="btn btn-ghost-light">
                Poser une question avant de payer
              </Link>
            </div>
            <p className="mt-4 font-mono text-xs" style={{ color: 'rgb(245 241 230 / 0.6)' }}>
              Montant affiché avant confirmation · Les résultats dépendent de ton activité et des
              opportunités disponibles
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
