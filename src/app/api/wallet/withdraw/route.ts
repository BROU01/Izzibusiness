import { NextResponse } from 'next/server';
import { internalError, requireUser } from '@/lib/api-response';
import { paymentsUnavailable } from '@/lib/payments-status';

// POST - Retrait : suspendu jusqu'à l'intégration PayDunya (voir payments-status.ts).
export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    return paymentsUnavailable();
  } catch (error) {
    return internalError('withdraw POST', error);
  }
}

// GET - Historique des retraits de l'utilisateur connecté.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { data, error } = await auth.supabase
      .from('transactions')
      .select('reference_id, amount, description, status, created_at')
      .eq('user_id', auth.user.id)
      .eq('type', 'withdraw')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return internalError('withdraw GET', error);

    return NextResponse.json({
      success: true,
      withdrawals: (data ?? []).map((tx) => ({
        id: tx.reference_id,
        amount: Math.abs(Number(tx.amount)),
        description: tx.description,
        status: tx.status,
        createdAt: tx.created_at,
      })),
    });
  } catch (error) {
    return internalError('withdraw GET', error);
  }
}
