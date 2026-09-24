/**
 * Programme « 20 jours » — DONNÉES DE DÉMONSTRATION (mock).
 *
 * Ces données sont affichées comme aperçu du parcours. Elles ne viennent
 * d'aucune table Supabase : quand le backend sera branché, remplacer cet
 * import par une requête et conserver les mêmes types.
 *
 * Règles éditoriales (voir DESIGN.md + brief Trust & Conversion) :
 * - chaque jour = 1 action concrète, durée réaliste, critère de validation
 *   observable (jamais « réussir » vague) ;
 * - aucune promesse de gains dans les titres ou descriptions ;
 * - les modèles de prompts sont des exemples à adapter, pas des produits.
 */

export type PromptExample = {
  /** Nom court du modèle, affiché comme titre. */
  label: string;
  /** Texte du modèle de prompt, à adapter par l'utilisateur. */
  prompt: string;
  /** Source d'inspiration, sans partenariat : hub de prompts connu. */
  site: 'PromptBase' | 'Awesome Prompts';
};

export type CurriculumDay = {
  /** Numéro du jour, 1-indexé. */
  day: number;
  title: string;
  /** Compétence ou résultat visé par le jour. */
  skill: string;
  /** Activité courte du jour (15 à 30 min au total). */
  activity: {
    /** "video" = à regarder, "lecture" = à lire, "outil" = à manipuler. */
    type: 'video' | 'lecture' | 'outil';
    title: string;
    durationMin: number;
  };
  /** Exercice pratique à réaliser. */
  exercise: string;
  /** Critère de validation : ce qui prouve que le jour est fait. */
  validation: string;
  /** Récompense en points de progression (démo). */
  reward: { xp: number; badge?: string };
  /** Modèle de prompt à adapter pour l'exercice du jour (mock). */
  promptExample: PromptExample;
};

export const CURRICULUM_DAYS: CurriculumDay[] = [
  {
    day: 1,
    title: 'Pose ton intention',
    skill: 'Clarifier ton objectif',
    activity: {
      type: 'video',
      title: 'Bienvenue sur Izzibusiness : comment avancer ici',
      durationMin: 15,
    },
    exercise: 'Écris ton objectif en 3 phrases, puis complète ton profil (nom, avatar, objectif).',
    validation: 'Ton profil affiche un objectif en 3 phrases.',
    reward: { xp: 50, badge: 'Nouveau' },
    promptExample: {
      label: 'Objectif en 3 phrases',
      site: 'Awesome Prompts',
      prompt:
        'Agis comme un coach. Pose-moi 3 questions, une par une, pour clarifier mon objectif professionnel. Puis rédige mon objectif final en 3 phrases exactement.',
    },
  },
  {
    day: 2,
    title: 'Repère un besoin concret',
    skill: 'Observer ton environnement',
    activity: {
      type: 'video',
      title: 'Trouver un besoin que des gens paient déjà',
      durationMin: 18,
    },
    exercise: 'Liste 5 problèmes concrets autour de toi, avec pour chacun une personne concernée.',
    validation: '5 problèmes notés, chacun relié à une personne réelle.',
    reward: { xp: 50 },
    promptExample: {
      label: 'Détection de besoins',
      site: 'PromptBase',
      prompt:
        "Agis comme un analyste de marché local. Voici 5 situations que j'observe : [liste]. Pour chacune, identifie le problème, qui le vit au quotidien, et comment il est résolu aujourd'hui.",
    },
  },
  {
    day: 3,
    title: 'Choisis ta première compétence',
    skill: 'Décider sans se disperser',
    activity: {
      type: 'lecture',
      title: '3 compétences adaptées aux débutants — et leurs usages',
      durationMin: 20,
    },
    exercise:
      'Choisis 1 compétence parmi 3 propositions et écris pourquoi elle correspond à ton objectif.',
    validation: 'Un choix écrit, avec 3 phrases de justification.',
    reward: { xp: 50 },
    promptExample: {
      label: 'Comparateur de compétences',
      site: 'Awesome Prompts',
      prompt:
        'Mon objectif : [objectif]. Compare ces 3 compétences : [A], [B], [C]. Critères : difficulté de départ, temps avant une première opportunité, demande locale. Termine par une recommandation argumentée en 3 phrases.',
    },
  },
  {
    day: 4,
    title: 'Étudie 3 offres existantes',
    skill: 'Analyser le marché local',
    activity: {
      type: 'outil',
      title: "Grille d'analyse : promesse, prix, public",
      durationMin: 20,
    },
    exercise: 'Analyse 3 offres concurrentes avec la grille : promesse, prix, public visé.',
    validation: 'Un tableau comparatif de 3 offres rempli.',
    reward: { xp: 50 },
    promptExample: {
      label: "Grille d'offre",
      site: 'PromptBase',
      prompt:
        'Analyse cette offre : [texte]. Extrais : la promesse, le public visé, le prix, et ce qui manque selon toi. Présente le résultat sous forme de tableau que je pourrai remplir pour 2 autres offres.',
    },
  },
  {
    day: 5,
    title: 'Écris ton offre claire',
    skill: 'Formuler ce que tu proposes',
    activity: {
      type: 'video',
      title: "L'offre en 5 messages : public, problème, résultat, prix, preuve",
      durationMin: 18,
    },
    exercise: 'Rédige ton offre en 5 messages, puis relis-la à voix haute.',
    validation: 'Une offre lisible par un proche sans explication supplémentaire.',
    reward: { xp: 100, badge: 'Offre prête' },
    promptExample: {
      label: 'Offre en 5 messages',
      site: 'Awesome Prompts',
      prompt:
        'Aide-moi à rédiger mon offre en 5 messages : pour qui, quel problème, quel résultat concret, à quel prix, quelle preuve. Pose-moi les questions une par une, puis assemble la version finale.',
    },
  },
  {
    day: 6,
    title: 'Crée ton profil vendeur',
    skill: 'Être trouvable et crédible',
    activity: { type: 'outil', title: 'Préparer les éléments de ton profil', durationMin: 20 },
    exercise: 'Renseigne ton profil vendeur : compétence, offre, exemple de travail.',
    validation: 'Un profil complet enregistré.',
    reward: { xp: 100 },
    promptExample: {
      label: 'Description de profil',
      site: 'PromptBase',
      prompt:
        'Ma compétence : [X]. Mon offre : [Y]. Rédige 3 versions courtes de description de profil vendeur, ton direct, sans exagération ni superlatif. 2 phrases maximum par version.',
    },
  },
  {
    day: 7,
    title: 'Fixe ton prix',
    skill: 'Pricer sans se brûler',
    activity: {
      type: 'lecture',
      title: 'Prix plancher, prix cible : la méthode des 2 seuils',
      durationMin: 15,
    },
    exercise: 'Calcule ton prix plancher et ton prix cible, et justifie chacun en 2 phrases.',
    validation: 'Deux prix écrits, chacun avec une justification.',
    reward: { xp: 75 },
    promptExample: {
      label: 'Méthode des 2 seuils',
      site: 'Awesome Prompts',
      prompt:
        'Calcule avec moi mes deux seuils de prix. Charges mensuelles : [X]. Heures de travail disponibles par mois : [Y]. Objectif de revenu mensuel : [Z]. Montre chaque calcul, puis explique la différence entre prix plancher et prix cible.',
    },
  },
  {
    day: 8,
    title: 'Prépare ton premier service',
    skill: 'Décrire une prestation livrable',
    activity: { type: 'outil', title: 'Le modèle de page de prestation', durationMin: 25 },
    exercise: "Décris ta prestation en 1 page : livrables, délai, nombre d'échanges inclus.",
    validation: 'Une page de prestation complète.',
    reward: { xp: 75 },
    promptExample: {
      label: 'Page de prestation',
      site: 'PromptBase',
      prompt:
        "Transforme cette description en page de prestation claire : titre, 3 livrables précis, délai de livraison, nombre d'allers-retours inclus. Reste factuel, aucun superlatif.",
    },
  },
  {
    day: 9,
    title: 'Trouve tes premiers contacts',
    skill: 'Constituer une liste de prospects',
    activity: {
      type: 'video',
      title: 'Où trouver des personnes qui ont le problème',
      durationMin: 18,
    },
    exercise: 'Identifie 10 personnes à qui proposer ton service, et note où les trouver.',
    validation: 'Une liste de 10 contacts avec un canal chacun.',
    reward: { xp: 75 },
    promptExample: {
      label: 'Cartographie des prospects',
      site: 'Awesome Prompts',
      prompt:
        "Pour le service [X] à [ville/pays], liste 5 endroits concrets — en ligne et hors ligne — où trouver des prospects. Pour chaque endroit, propose une phrase d'approche honnête.",
    },
  },
  {
    day: 10,
    title: 'Envoie ta première proposition',
    skill: 'Ouvrir une conversation',
    activity: {
      type: 'lecture',
      title: "Le message de proposition qui se lit jusqu'au bout",
      durationMin: 15,
    },
    exercise: 'Écris puis envoie 1 message de proposition à un contact de ta liste.',
    validation: 'Un message réellement envoyé.',
    reward: { xp: 100, badge: 'Premier contact' },
    promptExample: {
      label: 'Message de proposition',
      site: 'PromptBase',
      prompt:
        'Rédige un premier message de moins de 80 mots pour proposer [service] à [type de prospect]. Pas de flatterie, pas de promesse de résultat. Termine par une question ouverte claire.',
    },
  },
  {
    day: 11,
    title: 'Gère les objections',
    skill: "Répondre sans s'improviser",
    activity: {
      type: 'video',
      title: 'Les 3 objections les plus fréquentes et y répondre',
      durationMin: 20,
    },
    exercise: 'Prépare tes réponses aux 3 objections les plus probables de ton offre.',
    validation: '3 réponses écrites et relues.',
    reward: { xp: 75 },
    promptExample: {
      label: "Simulation d'objections",
      site: 'Awesome Prompts',
      prompt:
        "Joue le rôle d'un client sceptique auquel je propose [offre]. Réponds à mon premier message avec une objection réaliste. Après chaque réponse de ma part, propose-moi une reformulation honnête et courte.",
    },
  },
  {
    day: 12,
    title: 'Livre un travail qui convainc',
    skill: 'Produire un livrable réel',
    activity: {
      type: 'outil',
      title: 'Le cycle livrable : faire, vérifier, rendre',
      durationMin: 25,
    },
    exercise: 'Réalise un mini-livrable pour un proche (gratuit), du début à la remise.',
    validation: 'Un livrable rendu et un retour reçu.',
    reward: { xp: 100 },
    promptExample: {
      label: 'Contrôle qualité',
      site: 'PromptBase',
      prompt:
        'Voici mon livrable : [texte]. Vérifie trois choses : la clarté, les fautes, les promesses non tenues. Liste les 3 corrections prioritaires, une par une, avec une justification courte.',
    },
  },
  {
    day: 13,
    title: 'Demande un avis utile',
    skill: 'Progresser par le retour',
    activity: {
      type: 'lecture',
      title: 'Demander 1 point positif + 1 amélioration',
      durationMin: 15,
    },
    exercise: 'Demande un retour structuré sur ton livrable : 1 point fort, 1 amélioration.',
    validation: 'Un retour documenté dans ton journal de bord.',
    reward: { xp: 75 },
    promptExample: {
      label: 'Demande de retour',
      site: 'Awesome Prompts',
      prompt:
        'Rédige un message court demandant un retour structuré sur ce livrable : 1 point fort, 1 amélioration concrète. Le destinataire a peu de temps : 3 phrases maximum.',
    },
  },
  {
    day: 14,
    title: 'Corrige et améliore',
    skill: 'Itérer sur ton travail',
    activity: { type: 'outil', title: 'Appliquer un retour en une passe claire', durationMin: 20 },
    exercise: 'Applique 1 amélioration concrète au livrable du jour 12.',
    validation: 'Une version 2 rendue, avec la modification notée.',
    reward: { xp: 75 },
    promptExample: {
      label: "Plan d'amélioration",
      site: 'PromptBase',
      prompt:
        'Voici le retour reçu : [retour]. Propose UNE modification précise de mon livrable qui y répond, et explique en 2 phrases pourquoi elle suffit pour cette itération.',
    },
  },
  {
    day: 15,
    title: "Comprends l'argent qui rentre",
    skill: 'Lire les règles de paiement',
    activity: {
      type: 'lecture',
      title: "Wallet, frais, retraits : ce qui s'applique à toi",
      durationMin: 20,
    },
    exercise: 'Configure ton wallet et lis les conditions de retrait qui te concernent.',
    validation: 'Wallet configuré, frais et minimum notés.',
    reward: { xp: 75 },
    promptExample: {
      label: 'Conditions en clair',
      site: 'Awesome Prompts',
      prompt:
        'Explique simplement ces conditions de paiement : [texte]. Présente le résultat en tableau : ce qui est facturé, à quel moment, les limites. Signale tout point ambigu que je devrais poser au support.',
    },
  },
  {
    day: 16,
    title: 'Publie ton offre officiellement',
    skill: 'Passer du brouillon au public',
    activity: { type: 'outil', title: 'Publier ton offre sur la marketplace', durationMin: 25 },
    exercise: 'Publie ton offre sur la marketplace avec titre, description et prix.',
    validation: 'Une offre visible publiquement.',
    reward: { xp: 150, badge: 'Offre publiée' },
    promptExample: {
      label: "Fiche d'offre",
      site: 'PromptBase',
      prompt:
        'Rédige la fiche de mon offre : titre de 60 caractères maximum, description de 500 caractères maximum, 3 questions fréquentes avec des réponses honnêtes — y compris sur les limites de mon offre.',
    },
  },
  {
    day: 17,
    title: 'Te rends visible',
    skill: 'Faire connaître ton offre',
    activity: { type: 'video', title: 'Présenter son offre en 30 secondes', durationMin: 18 },
    exercise: 'Présente ton offre à 5 personnes et note chaque conversation.',
    validation: '5 conversations notées, avec réaction pour chacune.',
    reward: { xp: 100 },
    promptExample: {
      label: 'Pitch 30 secondes',
      site: 'Awesome Prompts',
      prompt:
        'Aide-moi à préparer un pitch oral de 30 secondes pour présenter [offre]. Structure : qui je suis, le problème que je vois, ce que je propose, une preuve concrète. À lire à voix haute, pas à réciter.',
    },
  },
  {
    day: 18,
    title: 'Passe en rythme régulier',
    skill: 'Tenir une cadence réaliste',
    activity: {
      type: 'lecture',
      title: '3 actions par semaine : le minimum qui fait avancer',
      durationMin: 15,
    },
    exercise: 'Planifie tes 3 actions de la semaine à venir dans ton agenda.',
    validation: 'Un planning écrit avec dates et heures.',
    reward: { xp: 100 },
    promptExample: {
      label: 'Plan de semaine',
      site: 'PromptBase',
      prompt:
        'Organise mes 3 actions de la semaine : [actions]. Ma disponibilité : [heures]. Propose un créneau réaliste par action, en gardant une marge si une action prend plus de temps que prévu.',
    },
  },
  {
    day: 19,
    title: 'Candidate à tes premières missions',
    skill: 'Utiliser les missions de la plateforme',
    activity: {
      type: 'outil',
      title: 'Choisir des missions adaptées à ton niveau',
      durationMin: 20,
    },
    exercise: 'Candidate à 2 missions correspondant à ton niveau affiché.',
    validation: '2 candidatures envoyées.',
    reward: { xp: 100 },
    promptExample: {
      label: 'Choix de mission',
      site: 'Awesome Prompts',
      prompt:
        'Compare ces 2 missions : [descriptions]. Mes compétences : [compétences]. Pour chacune : ce qui correspond, ce qui manque, et tout critère flou que je devrais clarifier avant de candidater.',
    },
  },
  {
    day: 20,
    title: 'Fais ton bilan et continue',
    skill: 'Mesurer et repartir proprement',
    activity: {
      type: 'video',
      title: 'Le bilan en 3 questions : marche, bloque, prochaine étape',
      durationMin: 15,
    },
    exercise: 'Écris ton bilan : ce qui marche, ce qui bloque, ta prochaine étape concrète.',
    validation: 'Un bilan terminé avec 1 prochaine étape datée.',
    reward: { xp: 200, badge: 'Parcours lancé' },
    promptExample: {
      label: 'Bilan en 3 questions',
      site: 'PromptBase',
      prompt:
        "Conduis mon bilan de parcours. Pose-moi 3 questions, une par une : qu'est-ce qui a marché, qu'est-ce qui a bloqué, quelle est ma prochaine étape. Puis résume mes réponses avec UNE étape datée.",
    },
  },
];

/** Nombre total de jours du programme. */
export const CURRICULUM_TOTAL = CURRICULUM_DAYS.length;

/** Retrouve un jour par son numéro (1-indexé), sinon undefined. */
export function getCurriculumDay(day: number): CurriculumDay | undefined {
  return CURRICULUM_DAYS.find((d) => d.day === day);
}

/**
 * Hub prompt engineering — ressources externes réelles et stables,
 * proposées à titre indicatif, sans partenariat ni affiliation.
 */
export const PROMPT_HUB: { name: string; url: string; desc: string }[] = [
  {
    name: 'PromptBase',
    url: 'https://promptbase.com',
    desc: 'Bibliothèque de prompts prêts à adapter (certains payants).',
  },
  {
    name: 'Awesome ChatGPT Prompts',
    url: 'https://github.com/f/awesome-chatgpt-prompts',
    desc: 'Recueil open source de prompts de référence, gratuit.',
  },
];
