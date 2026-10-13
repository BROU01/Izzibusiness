import { internalError, requireUser } from '@/lib/api-response';
import { NextResponse } from 'next/server';

// GET - Solde du wallet de l'utilisateur connecté (créé par handle_new_user).
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { data: wallet, error } = await auth.supabase
      .from('wallets')
      .select('balance, game_balance, currency')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (error) return internalError('wallet GET', error);

    const { data: profile } = await auth.supabase
      .from('profiles')
      .select('is_member')
      .eq('id', auth.user.id)
      .maybeSingle();

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
