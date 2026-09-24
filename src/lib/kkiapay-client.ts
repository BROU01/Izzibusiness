/**
 * Browser-side Kkiapay helpers.
 *
 * The actual transaction is created by `POST /api/payment/kkiapay`
 * (server-only, holds the secret key). This module opens the Kkiapay
 * widget in-page and polls for the resulting transaction status.
 *
 * NOTE: `kkiapay.ts` imports `next/server` and must NOT be imported
 * from client components.
 */

export type PaymentStatus = 'success' | 'failed' | 'pending';

export interface InitPaymentOptions {
  amount: number;
  phone: string;
  currency?: string;
  productName?: string;
  callback_url?: string;
}

export interface InitPaymentResult {
  success: boolean;
  transactionId: string;
  widgetConfig: { publicKey: string };
}

declare global {
  interface Window {
    openKkiapayWidget?: (config: Record<string, unknown>) => void;
  }
}

const WIDGET_SCRIPT_ID = 'kkiapay-widget-script';
const WIDGET_SCRIPT_SRC = 'https://cdn.kkiapay.me/k.js';
const WIDGET_TIMEOUT_MS = 10_000;
const STATUS_POLL_INTERVAL_MS = 3_000;
const STATUS_POLL_MAX_ATTEMPTS = 30; // ~90 seconds

function loadWidgetScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error("Le paiement n'est disponible que dans le navigateur."));
      return;
    }

    // Idempotent: reuse the script if it is already present.
    const existing = document.getElementById(WIDGET_SCRIPT_ID);
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Impossible de charger le module de paiement.')),
      );
      return;
    }

    const script = document.createElement('script');
    script.id = WIDGET_SCRIPT_ID;
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () =>
      reject(new Error('Impossible de charger le module de paiement.')),
    );
    document.body.appendChild(script);
  });
}

async function openWidget(config: { publicKey: string; transactionId: string }): Promise<void> {
  await loadWidgetScript();

  if (typeof window.openKkiapayWidget !== 'function') {
    throw new Error("Le module de paiement n'est pas prêt. Réessayez.");
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      // Last resort: open the hosted widget page.
      window.open(
        `https://widget.kkiapay.me/${config.transactionId}`,
        '_blank',
        'noopener,noreferrer',
      );
      resolve();
    }, WIDGET_TIMEOUT_MS);

    try {
      window.openKkiapayWidget!({
        amount: undefined, // filled by caller via closure below
        ...config,
        callback: (data: { transactionId?: string }) => {
          window.clearTimeout(timeout);
          if (data?.transactionId) {
            resolve();
          } else {
            reject(new Error('Paiement annulé.'));
          }
        },
        onclose: () => {
          window.clearTimeout(timeout);
          reject(new Error('Paiement annulé.'));
        },
      });
    } catch (error) {
      window.clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error("Échec de l'ouverture du widget."));
    }
  });
}

/**
 * Creates the transaction server-side then opens the Kkiapay widget.
 * Resolves once the widget has been opened (not once payment completed).
 */
export async function initPayment(options: InitPaymentOptions): Promise<InitPaymentResult> {
  const response = await fetch('/api/payment/kkiapay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: options.phone,
      amount: options.amount,
      currency: options.currency ?? 'XOF',
      paymentMethod: 'momo',
      productName: options.productName,
      callback_url: options.callback_url,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    (InitPaymentResult & { error?: string }) | null;

  if (!response.ok || !data?.success) {
    throw new Error(data?.error ?? "Impossible d'initialiser le paiement.");
  }

  await openWidget({
    publicKey: data.widgetConfig.publicKey,
    transactionId: data.transactionId,
    ...options,
  });

  return data;
}

/**
 * Polls the transaction status until it leaves `pending` or the
 * attempt budget is exhausted.
 */
export async function checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
  for (let attempt = 0; attempt < STATUS_POLL_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, STATUS_POLL_INTERVAL_MS));
    }

    try {
      const response = await fetch(
        `/api/payment/kkiapay?transactionId=${encodeURIComponent(transactionId)}`,
        { cache: 'no-store' },
      );

      if (response.status === 404) {
        // Transaction not yet visible: keep polling.
        continue;
      }

      if (!response.ok) continue;

      const data = (await response.json()) as {
        success?: boolean;
        transaction?: { status?: string };
      };

      const status = data.transaction?.status;
      if (status === 'success') return 'success';
      if (status === 'failed' || status === 'abandoned') return 'failed';
      if (status === 'success' || status === 'failed') {
        return status as PaymentStatus;
      }
      // pending / unknown -> keep polling
    } catch {
      // Network glitch: retry on next tick.
    }
  }

  return 'pending';
}
