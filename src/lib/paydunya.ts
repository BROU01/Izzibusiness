import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Client PayDunya — serveur uniquement (les clés ne quittent jamais le serveur).
 *
 * Encaissement (« pay-in ») : facture de paiement (checkout-invoice) puis
 * notification IPN. Endpoints confirmés par le SDK officiel paydunya-php :
 *   - POST {base}/v1/checkout-invoice/create
 *   - GET  {base}/v1/checkout-invoice/confirm/{token}
 * avec base = https://app.paydunya.com/sandbox-api (test) ou /api (live).
 *
 * Déboursement (« pay-out ») : API v2 disburse (get-invoice puis
 * submit-invoice). À activer et vérifier dans le tableau de bord PayDunya.
 *
 * Variables d'environnement :
 *   PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN,
 *   PAYDUNYA_MODE = "test" | "live" (défaut : test), PAYDUNYA_STORE_NAME.
 */

const ROOT = 'https://app.paydunya.com';

export class PaydunyaNotConfiguredError extends Error {
  constructor() {
    super('PayDunya n’est pas configuré (PAYDUNYA_MASTER_KEY / PRIVATE_KEY / TOKEN).');
    this.name = 'PaydunyaNotConfiguredError';
  }
}

export class PaydunyaApiError extends Error {
  constructor(
    message: string,
    readonly responseCode: string | null,
  ) {
    super(message);
    this.name = 'PaydunyaApiError';
  }
}

interface PaydunyaKeys {
  masterKey: string;
  privateKey: string;
  token: string;
  live: boolean;
  storeName: string;
}

function getKeys(): PaydunyaKeys {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!masterKey || !privateKey || !token) throw new PaydunyaNotConfiguredError();
  return {
    masterKey,
    privateKey,
    token,
    live: process.env.PAYDUNYA_MODE === 'live',
    storeName: process.env.PAYDUNYA_STORE_NAME || 'Izzibusiness',
  };
}

export function isPaydunyaConfigured(): boolean {
  return Boolean(
    process.env.PAYDUNYA_MASTER_KEY &&
    process.env.PAYDUNYA_PRIVATE_KEY &&
    process.env.PAYDUNYA_TOKEN,
  );
}

export function isPaydunyaLive(): boolean {
  return process.env.PAYDUNYA_MODE === 'live';
}

function headers(keys: PaydunyaKeys): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'PAYDUNYA-MASTER-KEY': keys.masterKey,
    'PAYDUNYA-PRIVATE-KEY': keys.privateKey,
    'PAYDUNYA-TOKEN': keys.token,
  };
}

async function call(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown },
): Promise<Record<string, unknown>> {
  const keys = getKeys();
  const base = keys.live ? `${ROOT}/api` : `${ROOT}/sandbox-api`;
  const response = await fetch(`${base}${path}`, {
    method: init.method,
    headers: headers(keys),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    throw new PaydunyaApiError(`Réponse PayDunya illisible (HTTP ${response.status})`, null);
  }
  return payload;
}

function responseCode(payload: Record<string, unknown>): string | null {
  return typeof payload.response_code === 'string' ? payload.response_code : null;
}

// ---------------------------------------------------------------------------
// Encaissement
// ---------------------------------------------------------------------------

export interface CheckoutInput {
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  customData: Record<string, string>;
}

/** Crée une facture PayDunya. Renvoie le jeton et l'URL de paiement. */
export async function createCheckoutInvoice(
  input: CheckoutInput,
): Promise<{ token: string; checkoutUrl: string }> {
  const keys = getKeys();
  const payload = await call('/v1/checkout-invoice/create', {
    method: 'POST',
    body: {
      invoice: { total_amount: input.amount, description: input.description },
      store: { name: keys.storeName },
      actions: {
        cancel_url: input.cancelUrl,
        return_url: input.returnUrl,
        callback_url: input.callbackUrl,
      },
      custom_data: input.customData,
    },
  });

  const code = responseCode(payload);
  if (
    code !== '00' ||
    typeof payload.token !== 'string' ||
    typeof payload.response_text !== 'string'
  ) {
    throw new PaydunyaApiError(
      typeof payload.response_text === 'string' ? payload.response_text : 'Facture refusée',
      code,
    );
  }
  return { token: payload.token, checkoutUrl: payload.response_text };
}

export type InvoiceStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

/**
 * Statut faisant foi d'une facture, lu directement chez PayDunya.
 * Ne jamais créditer sur la seule base du contenu d'une IPN.
 */
export async function confirmInvoice(token: string): Promise<{
  status: InvoiceStatus;
  totalAmount: number;
  raw: Record<string, unknown>;
}> {
  const payload = await call(`/v1/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
    method: 'GET',
  });
  const code = responseCode(payload);
  if (code !== '00') {
    throw new PaydunyaApiError(
      typeof payload.response_text === 'string' ? payload.response_text : 'Facture introuvable',
      code,
    );
  }
  const rawStatus = typeof payload.status === 'string' ? payload.status.toLowerCase() : 'pending';
  const status: InvoiceStatus =
    rawStatus === 'completed' || rawStatus === 'cancelled' || rawStatus === 'failed'
      ? rawStatus
      : 'pending';
  const invoice = (payload.invoice ?? {}) as Record<string, unknown>;
  return { status, totalAmount: Number(invoice.total_amount ?? 0), raw: payload };
}

/**
 * Vérifie le champ `hash` d'une IPN : SHA-512 de la MasterKey (doc PayDunya).
 * Comparaison en temps constant.
 */
export function isValidIpnHash(hash: string | null | undefined): boolean {
  if (!hash) return false;
  const expected = createHash('sha512').update(getKeys().masterKey).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(hash.toLowerCase(), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Déboursement (paiement sortant vers Mobile Money)
// ---------------------------------------------------------------------------

export interface DisburseInput {
  /** Numéro national sans indicatif, tel que PayDunya l'attend. */
  accountAlias: string;
  amount: number;
  withdrawMode: string;
  callbackUrl: string;
}

/** Étape 1 : prépare un déboursement et renvoie son jeton. */
export async function createDisburseInvoice(input: DisburseInput): Promise<string> {
  const payload = await call('/v2/disburse/get-invoice', {
    method: 'POST',
    body: {
      account_alias: input.accountAlias,
      amount: input.amount,
      withdraw_mode: input.withdrawMode,
      callback_url: input.callbackUrl,
    },
  });
  const code = responseCode(payload);
  if (code !== '00' || typeof payload.disburse_token !== 'string') {
    throw new PaydunyaApiError(
      typeof payload.response_text === 'string' ? payload.response_text : 'Déboursement refusé',
      code,
    );
  }
  return payload.disburse_token;
}

export type DisburseStatus = 'success' | 'pending' | 'failed';

function normalizeDisburseStatus(payload: Record<string, unknown>): DisburseStatus {
  const raw = String(payload.status ?? payload.response_text ?? '').toLowerCase();
  if (raw.includes('success') || raw.includes('completed')) return 'success';
  if (raw.includes('fail') || raw.includes('cancel') || raw.includes('reject')) return 'failed';
  return 'pending';
}

/** Étape 2 : exécute le déboursement préparé. */
export async function submitDisburseInvoice(
  disburseToken: string,
  disburseId: string,
): Promise<{ status: DisburseStatus; providerRef: string | null; raw: Record<string, unknown> }> {
  const payload = await call('/v2/disburse/submit-invoice', {
    method: 'POST',
    body: { disburse_invoice: disburseToken, disburse_id: disburseId },
  });
  const code = responseCode(payload);
  if (code !== '00') {
    return { status: 'failed', providerRef: null, raw: payload };
  }
  return {
    status: normalizeDisburseStatus(payload),
    providerRef: typeof payload.transaction_id === 'string' ? payload.transaction_id : null,
    raw: payload,
  };
}

/** Statut faisant foi d'un déboursement. */
export async function checkDisburseStatus(
  disburseToken: string,
): Promise<{ status: DisburseStatus; raw: Record<string, unknown> }> {
  const payload = await call('/v2/disburse/check-status', {
    method: 'POST',
    body: { disburse_invoice: disburseToken },
  });
  return { status: normalizeDisburseStatus(payload), raw: payload };
}
