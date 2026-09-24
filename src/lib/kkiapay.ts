// Kkiapay Mobile Money API
// Documentation: https://docs.kkiapay.me/
// Supporte: Orange Money, MTN MoMo, Wave, Moov Money
// Couverture: Bénin, Côte d'Ivoire, Togo, Sénégal, Niger

const KKIAPAY_API_URL = 'https://api.kkiapay.me';
const KKIAPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '';
const KKIAPAY_PRIVATE_KEY = process.env.KKIAPAY_PRIVATE_KEY || '';
const KKIAPAY_SECRET_KEY = process.env.KKIAPAY_SECRET_KEY || '';

// Modes de paiement supportés par Kkiapay
export const KKIAPAY_PAYMENT_METHODS = {
  MOMO: 'momo', // Mobile Money
  CARD: 'card', // Carte bancaire
  WALLET: 'wallet', // Portefeuille électronique
} as const;

// Pays supportés
export const KKIAPAY_COUNTRIES = {
  BENIN: 'BJ',
  COTE_DIVOIRE: 'CI',
  TOGO: 'TG',
  SENEGAL: 'SN',
  NIGER: 'NE',
} as const;

interface KkiapayTransaction {
  transactionId: string;
  amount: number;
  phone: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentMethod: string;
  createdAt: string;
}

interface InitPaymentParams {
  amount: number;
  phone: string;
  paymentMethod?: 'momo' | 'card' | 'wallet';
  country?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  callback?: string;
  sandbox?: boolean;
}

/**
 * Générer un identifiant unique de transaction
 */
export function generateTransactionId(): string {
  return `kkiapay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Construire les données pour le widget Kkiapay (côté client)
 * Cette fonction est utilisée pour configurer le widget de paiement
 */
export function getWidgetConfig(params: InitPaymentParams) {
  return {
    amount: params.amount,
    key: KKIAPAY_PUBLIC_KEY,
    phone: params.phone,
    paymentmethod: params.paymentMethod || KKIAPAY_PAYMENT_METHODS.MOMO,
    countries: params.country ? [params.country] : [KKIAPAY_COUNTRIES.BENIN],
    sandbox: params.sandbox ?? process.env.NODE_ENV !== 'production',
    callback: params.callback || '',
    position: 'center' as const,
    theme: '#6366f1', // Couleur accent du site
  };
}

/**
 * Vérifier le statut d'une transaction côté serveur
 * Utilise l'API Kkiapay pour valider qu'un paiement a bien été reçu
 */
export async function verifyTransaction(transactionId: string): Promise<KkiapayTransaction | null> {
  try {
    const response = await fetch(`${KKIAPAY_API_URL}/api/v1/transactions/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'x-private-key': KKIAPAY_PRIVATE_KEY,
        'x-secret-key': KKIAPAY_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Kkiapay verification failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      transactionId: data.transactionId || transactionId,
      amount: data.amount || 0,
      phone: data.phone || '',
      status: data.status || 'FAILED',
      paymentMethod: data.paymentMethod || '',
      createdAt: data.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Kkiapay verification error:', error);
    return null;
  }
}

/**
 * Vérifier le callback Kkiapay (appelé par Kkiapay après le paiement)
 */
export async function handleCallback(
  transactionId: string,
  signature: string,
): Promise<{ success: boolean; transaction?: KkiapayTransaction }> {
  try {
    // Vérifier la signature pour sécuriser le callback
    const expectedSignature = Buffer.from(`${transactionId}${KKIAPAY_SECRET_KEY}`).toString('hex');

    if (signature !== expectedSignature) {
      console.error('Kkiapay callback signature mismatch');
      return { success: false };
    }

    // Vérifier la transaction
    const transaction = await verifyTransaction(transactionId);

    if (transaction && transaction.status === 'SUCCESS') {
      return { success: true, transaction };
    }

    return { success: false, transaction: transaction || undefined };
  } catch (error) {
    console.error('Kkiapay callback error:', error);
    return { success: false };
  }
}

/**
 * Formatage des montants pour l'affichage
 */
export function formatAmount(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
