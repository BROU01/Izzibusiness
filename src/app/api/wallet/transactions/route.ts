import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, internalError, requireUser } from '@/lib/api-response';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  type: z
    .enum([
      'deposit',
      'withdraw',
      'game_bet',
      'game_win',
      'mission_reward',
      'referral_bonus',
      'purchase',
    ])
    .optional(),
});

// GET - Historique des transactions de l'utilisateur connecté.
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Paramètres invalides.', 400);
    }
    const { limit, offset, type } = parsed.data;

    let query = auth.supabase
      .from('transactions')
      .select('id, type, amount, balance_after, description, reference_id, status, created_at', {
        count: 'exact',
      })
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;
    if (error) return internalError('transactions GET', error);

    return NextResponse.json({
      success: true,
      transactions: (data ?? []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        balanceAfter: Number(tx.balance_after),
        description: tx.description,
        referenceId: tx.reference_id,
        status: tx.status,
        createdAt: tx.created_at,
      })),
      total: count ?? 0,
    });
  } catch (error) {
    return internalError('transactions GET', error);
  }
}
