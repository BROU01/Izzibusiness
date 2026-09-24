// PawaPay Mobile Money API
// Documentation: https://docs.pawapay.io/

const PAWAPAY_API_URL = 'https://api.pawapay.io';
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN || '';

interface CreateDepositRequest {
  tokenId: string;
  amount: string;
  currency: string;
  callbackUrl?: string;
  paymentMethod?: string;
  reason?: string;
  metadata?: Record<string, string>;
}

interface DepositResponse {
  success: boolean;
  depositId?: string;
  status?: string;
  message: string;
  paymentUrl?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  status: string;
  depositId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  createdAt: string;
}

/**
 * Initier un dépôt Mobile Money
 */
export async function createDeposit(params: CreateDepositRequest): Promise<DepositResponse> {
  try {
    const response = await fetch(`${PAWAPAY_API_URL}/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
      },
      body: JSON.stringify({
        tokenId: params.tokenId,
        amount: params.amount,
        currency: params.currency || 'XOF',
        callbackUrl: params.callbackUrl,
        paymentMethod: params.paymentMethod,
        reason: params.reason,
        metadata: params.metadata,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        depositId: data.depositId,
        status: data.status,
        message: 'Paiement initié avec succès',
        paymentUrl: data.paymentUrl,
      };
    }

    return {
      success: false,
      message: data.message || "Erreur lors de l'initiation du paiement",
    };
  } catch {
    return {
      success: false,
      message: 'Erreur de connexion au serveur PawaPay',
    };
  }
}

/**
 * Vérifier le statut d'un paiement
 */
export async function getDepositStatus(depositId: string): Promise<PaymentStatusResponse> {
  try {
    const response = await fetch(`${PAWAPAY_API_URL}/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        status: data.status,
        depositId: data.depositId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        createdAt: data.createdAt,
      };
    }

    return {
      success: false,
      status: 'UNKNOWN',
      depositId: depositId,
      amount: '',
      currency: '',
      paymentMethod: '',
      createdAt: '',
    };
  } catch {
    return {
      success: false,
      status: 'ERROR',
      depositId: depositId,
      amount: '',
      currency: '',
      paymentMethod: '',
      createdAt: '',
    };
  }
}

/**
 * Générer un token pour le paiement (côté client)
 * Ce token est utilisé pour initier le paiement sans exposer les clés API
 */
export function generatePaymentToken(productId: string, amount: string): string {
  // En production, ce token serait généré côté serveur
  // avec signature pour éviter la falsification
  return Buffer.from(
    JSON.stringify({
      productId,
      amount,
      timestamp: Date.now(),
    }),
  ).toString('base64');
}
