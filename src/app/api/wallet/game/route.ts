import { NextResponse } from 'next/server';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, internalError, requireUser } from '@/lib/api-response';

/**
 * L'ancienne route acceptait `{ action: 'win', amount }` envoyé par le
 * navigateur : n'importe qui pouvait se créditer le montant de son choix.
 * Les mises sont fermées jusqu'à ce que le résultat de chaque partie soit
 * tiré côté serveur.
 */
export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    return apiError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Les jeux sont en maintenance. Aucune mise n’a été prise.',
      503,
    );
  } catch (error) {
    return internalError('game POST', error);
  }
}

// GET - Soldes principal et jeu de l'utilisateur connecté.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { data: wallet, error } = await auth.supabase
      .from('wallets')
      .select('balance, game_balance, currency')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (error) return internalError('game GET', error);

    return NextResponse.json({
      success: true,
      balance: Number(wallet?.balance ?? 0),
      gameBalance: Number(wallet?.game_balance ?? 0),
      currency: wallet?.currency ?? 'FCFA',
    });
  } catch (error) {
    return internalError('game GET', error);
  }
}
