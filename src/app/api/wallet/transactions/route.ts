import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, internalError, requireUser } from '@/lib/api-response';
import { query, queryOne } from '@/lib/db';

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  status: string;
  created_at: Date;
}

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

    // Filtre sur le type optionnel : $2 null = tous les types.
    const filters = [auth.user.id, type ?? null];
    const [rows, totalRow] = await Promise.all([
      query<TransactionRow>(
        `select id, type, amount::float8 as amount, balance_after::float8 as balance_after,
                description, reference_id, status, created_at
           from transactions
          where user_id = $1 and ($2::text is null or type = $2)
          order by created_at desc
          limit $3 offset $4`,
        [...filters, limit, offset],
      ),
      queryOne<{ total: number }>(
        `select count(*)::int as total
           from transactions
          where user_id = $1 and ($2::text is null or type = $2)`,
        filters,
      ),
    ]);

    return NextResponse.json({
      success: true,
      transactions: rows.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        balanceAfter: Number(tx.balance_after),
        description: tx.description,
        referenceId: tx.reference_id,
        status: tx.status,
        createdAt: tx.created_at.toISOString(),
      })),
      total: totalRow?.total ?? 0,
    });
  } catch (error) {
    return internalError('transactions GET', error);
  }
}
