import { NextResponse } from 'next/server';
import { refreshWithdrawalStatus } from '@/lib/payments/withdrawals';

/**
 * Retour de déboursement PayDunya. Le contenu n'est pas signé de façon
 * documentée : il ne sert qu'à identifier le retrait, dont le statut est
 * ensuite relu chez PayDunya (check-status) avant toute mise à jour.
 */
export async function POST(request: Request) {
  let token: string | null = null;
  try {
    const type = request.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const json = (await request.json()) as Record<string, unknown>;
      const data = (json.data ?? json) as Record<string, unknown>;
      token = typeof data.disburse_token === 'string' ? data.disburse_token : null;
      token ??= typeof data.token === 'string' ? data.token : null;
    } else {
      const form = await request.formData();
      const value =
        form.get('data[disburse_token]') ?? form.get('disburse_token') ?? form.get('token');
      token = typeof value === 'string' ? value : null;
    }
  } catch {
    token = null;
  }

  if (!token || !/^[A-Za-z0-9_-]{6,128}$/.test(token)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    const status = await refreshWithdrawalStatus({ disburseToken: token });
    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error('[paydunya/disburse]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
