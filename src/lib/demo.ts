/**
 * Mode démo serveur.
 *
 * Quand les credentials Supabase ne sont pas configurés, les API ne peuvent
 * ni authentifier ni persister quoi que ce soit. Sans ce fallback, toutes les
 * API renvoient 401 — c'est ce qui rendait les jeux inutilisables (mises et
 * encaissements systématiquement refusés).
 *
 * Ce module fournit un état en mémoire (par numéro de téléphone) pour que le
 * parcours complet — inscription, wallet, jeux, transactions, notifications,
 * parrainage — fonctionne sans backend. Il est ACTIF UNIQUEMENT quand
 * `isSupabaseConfigured()` renvoie false ; en production avec Supabase,
 * tout le code ci-dessous est ignoré.
 */

import { ADHESION_FEE, MIN_WITHDRAWAL, REFERRAL_BONUS } from './config';

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export interface DemoWallet {
  balance: number;
  gameBalance: number;
  currency: string;
}

export interface DemoTransaction {
  id: string;
  type:
    | 'deposit'
    | 'withdraw'
    | 'game_bet'
    | 'game_win'
    | 'mission_reward'
    | 'referral_bonus'
    | 'purchase'
    | 'membership';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'transaction' | 'game' | 'referral';
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface DemoReferral {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'pending';
  earned: number;
  createdAt: string;
}

export interface DemoUser {
  id: string;
  name: string;
  phone: string;
  isMember: boolean;
  wallet: DemoWallet;
  transactions: DemoTransaction[];
  notifications: DemoNotification[];
  referrals: DemoReferral[];
  /** Code de parrainage de l'utilisateur. */
  referralCode: string;
  /** Téléphone du parrain, si l'inscription en a précisé un. */
  referredBy: string | null;
}

// État en mémoire du process serveur. Suffisant pour la démo ; zéro impact
// production car ce chemin n'est jamais pris quand Supabase est configuré.
const users = new Map<string, DemoUser>();

// Comptes de parrainage en attente : quand un nouveau compte s'inscrit avec
// le téléphone d'un parrain existant, le bonus est crédité au parrain.
function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeReferralCode(phone: string): string {
  return `IZZ${phone.replace(/\D/g, '').slice(-4)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function getDemoUser(phone: string): DemoUser | undefined {
  return users.get(phone);
}

export function createDemoUser(name: string, phone: string, referredBy?: string | null): DemoUser {
  const user: DemoUser = {
    id: id('user'),
    name,
    phone,
    isMember: false,
    wallet: { balance: 0, gameBalance: 0, currency: 'FCFA' },
    transactions: [],
    notifications: [
      {
        id: id('notif'),
        title: 'Bienvenue sur Izzibusiness',
        message: `Bonjour ${name}, bienvenue ! Complétez votre adhésion (${ADHESION_FEE.toLocaleString('fr-FR')} FCFA) pour accéder aux jeux et aux retraits.`,
        type: 'info',
        read: false,
        actionUrl: '/dashboard/wallet',
        createdAt: new Date().toISOString(),
      },
    ],
    referrals: [],
    referralCode: makeReferralCode(phone),
    referredBy: referredBy ?? null,
  };
  users.set(phone, user);

  // Bonus parrain si le parrain existe déjà.
  if (referredBy) {
    const sponsor = users.get(referredBy);
    if (sponsor) {
      creditDemo(
        sponsor,
        REFERRAL_BONUS,
        'referral_bonus',
        `${name} s'est inscrit avec votre lien`,
      );
      sponsor.referrals.unshift({
        id: id('ref'),
        name,
        phone,
        status: 'active',
        earned: REFERRAL_BONUS,
        createdAt: new Date().toISOString(),
      });
      sponsor.notifications.unshift({
        id: id('notif'),
        title: 'Bonus parrainage',
        message: `${name} s'est inscrit avec votre lien. Vous recevez ${REFERRAL_BONUS.toLocaleString('fr-FR')} FCFA !`,
        type: 'referral',
        read: false,
        actionUrl: '/dashboard/referrals',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return user;
}

/** Crédite le wallet principal et journalise la transaction. */
export function creditDemo(
  user: DemoUser,
  amount: number,
  type: DemoTransaction['type'],
  description: string,
): DemoTransaction {
  user.wallet.balance += amount;
  const tx: DemoTransaction = {
    id: id('tx'),
    type,
    amount,
    balanceAfter: user.wallet.balance,
    description,
    referenceId: id('ref'),
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  user.transactions.unshift(tx);
  return tx;
}

/** Débite le wallet principal. Renvoie null si solde insuffisant. */
export function debitDemo(
  user: DemoUser,
  amount: number,
  type: DemoTransaction['type'],
  description: string,
): DemoTransaction | null {
  if (user.wallet.balance < amount) return null;
  user.wallet.balance -= amount;
  const tx: DemoTransaction = {
    id: id('tx'),
    type,
    amount: -amount,
    balanceAfter: user.wallet.balance,
    description,
    referenceId: id('ref'),
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  user.transactions.unshift(tx);
  return tx;
}

/**
 * Mise de jeu : déplace le montant du wallet principal vers le solde de jeux.
 * Renvoie null si solde insuffisant.
 */
export function placeDemoBet(user: DemoUser, amount: number, game: string) {
  if (user.wallet.balance < amount) return null;
  user.wallet.balance -= amount;
  user.wallet.gameBalance += amount;
  const tx: DemoTransaction = {
    id: id('tx'),
    type: 'game_bet',
    amount: -amount,
    balanceAfter: user.wallet.balance,
    description: `Mise : ${game}`,
    referenceId: id('bet'),
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  user.transactions.unshift(tx);
  return { balance: user.wallet.balance, gameBalance: user.wallet.gameBalance, tx };
}

/**
 * Gain de jeu : retire du solde de jeux (sans passer en négatif) et crédite
 * le wallet principal du montant du gain.
 */
export function collectDemoWin(user: DemoUser, amount: number, game: string) {
  user.wallet.gameBalance = Math.max(user.wallet.gameBalance - amount, 0);
  user.wallet.balance += amount;
  const tx: DemoTransaction = {
    id: id('tx'),
    type: 'game_win',
    amount,
    balanceAfter: user.wallet.balance,
    description: `Gain : ${game}`,
    referenceId: id('win'),
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  user.transactions.unshift(tx);
  return { balance: user.wallet.balance, gameBalance: user.wallet.gameBalance, tx };
}

/** Retrait : débite montant + frais. Renvoie une erreur explicite sinon. */
export function withdrawDemo(user: DemoUser, amount: number, provider: string, phone: string) {
  if (amount < MIN_WITHDRAWAL) {
    return {
      error: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL.toLocaleString('fr-FR')} FCFA`,
    };
  }
  const fees = Math.ceil(amount * 0.02);
  const total = amount + fees;
  if (user.wallet.balance < total) {
    return {
      error: `Solde insuffisant. Montant : ${amount.toLocaleString('fr-FR')} + frais : ${fees.toLocaleString('fr-FR')} = ${total.toLocaleString('fr-FR')} FCFA`,
    };
  }
  user.wallet.balance -= total;
  const withdrawalId = id('wd');
  const tx: DemoTransaction = {
    id: id('tx'),
    type: 'withdraw',
    amount: -total,
    balanceAfter: user.wallet.balance,
    description: `Retrait ${provider.toUpperCase()} vers ${phone}`,
    referenceId: withdrawalId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  user.transactions.unshift(tx);
  user.notifications.unshift({
    id: id('notif'),
    title: 'Retrait en cours',
    message: `Votre retrait de ${amount.toLocaleString('fr-FR')} FCFA vers ${provider} est en cours de traitement. Délai : 1-24h.`,
    type: 'transaction',
    read: false,
    actionUrl: '/dashboard/wallet',
    createdAt: new Date().toISOString(),
  });
  return {
    withdrawal: {
      id: withdrawalId,
      amount,
      fees,
      total,
      phone,
      provider,
      status: 'pending',
      estimatedTime: '1-24 heures',
    },
    newBalance: user.wallet.balance,
  };
}

export function pushDemoNotification(
  user: DemoUser,
  notif: Omit<DemoNotification, 'id' | 'read' | 'createdAt'>,
): void {
  user.notifications.unshift({
    ...notif,
    id: id('notif'),
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/** Paiement d'adhésion (mode démo : validé immédiatement). */
export function payDemoMembership(user: DemoUser, provider: string, phone: string) {
  const tx = debitDemo(user, ADHESION_FEE, 'membership', `Adhésion via ${provider}`);
  if (!tx) {
    return {
      error: `Solde insuffisant. Créditez d'abord votre wallet de ${ADHESION_FEE.toLocaleString('fr-FR')} FCFA.`,
    };
  }
  user.isMember = true;
  pushDemoNotification(user, {
    title: 'Adhésion confirmée',
    message:
      'Bienvenue ! Votre compte est maintenant actif : jeux, missions et retraits débloqués.',
    type: 'success',
    actionUrl: '/games',
  });
  return {
    membership: { status: 'active', paidAt: new Date().toISOString(), method: provider, phone },
    newBalance: user.wallet.balance,
  };
}
