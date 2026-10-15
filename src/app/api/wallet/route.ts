import { internalError, requireUser } from '@/lib/api-response';
import { queryOne } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Solde du wallet de l'utilisateur connecté (créé par create_member).
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const [wallet, profile] = await Promise.all([
      queryOne<{ balance: number; game_balance: number; currency: string }>(
        `select balance::float8 as balance, game_balance::float8 as game_balance, currency
           from wallets where user_id = $1`,
        [auth.user.id],
      ),
      queryOne<{ is_member: boolean }>('select is_member from profiles where id = $1', [
        auth.user.id,
      ]),
    ]);

    return NextResponse.json({
      success: true,
      wallet: {
        balance: Number(wallet?.balance ?? 0),
        gameBalance: Number(wallet?.game_balance ?? 0),
        currency: wallet?.currency ?? 'FCFA',
      },
      isMember: profile?.is_member === true,
    });
  } catch (error) {
    return internalError('wallet GET', error);
  }
}
