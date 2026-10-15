import { NextResponse } from 'next/server';
import { PaydunyaNotConfiguredError, isValidIpnHash } from '@/lib/paydunya';
import { syncPaymentFromProvider } from '@/lib/payments/sync';

/**
 * IPN PayDunya (URL à déclarer dans « Instant Payment Notification »).
 *
 * PayDunya envoie un POST application/x-www-form-urlencoded dont les champs
 * sont sous la clé `data` : data[hash], data[status], data[invoice][token]…
 * 1. le hash doit valoir SHA-512(MasterKey) ;
 * 2. le statut n'est PAS cru sur parole : on relit la facture chez PayDunya
 *    (syncPaymentFromProvider) avant tout crédit.
 */
export async function POST(request: Request) {
  const fields = await readFields(request);
  const hash = fields['data[hash]'] ?? fields.hash ?? null;
  const token = fields['data[invoice][token]'] ?? fields['data[token]'] ?? fields.token ?? null;

  try {
    if (!isValidIpnHash(hash)) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
    if (!token || !/^[A-Za-z0-9_-]{6,128}$/.test(token)) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const outcome = await syncPaymentFromProvider(token);
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    if (error instanceof PaydunyaNotConfiguredError) {
      return NextResponse.json({ error: 'service_unavailable' }, { status: 503 });
    }
    console.error('[paydunya/ipn]', error instanceof Error ? error.message : error);
    // 500 : PayDunya pourra renvoyer la notification.
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

/** Accepte le format formulaire (documenté) et JSON (par sécurité). */
async function readFields(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) {
      const json = (await request.json()) as Record<string, unknown>;
      const data = (json.data ?? json) as Record<string, unknown>;
      const invoice = (data.invoice ?? {}) as Record<string, unknown>;
      return {
        'data[hash]': String(data.hash ?? ''),
        'data[invoice][token]': String(invoice.token ?? data.token ?? ''),
      };
    }
    const form = await request.formData();
    const out: Record<string, string> = {};
    form.forEach((value, key) => {
      if (typeof value === 'string') out[key] = value;
    });
    return out;
  } catch {
    return {};
  }
}
