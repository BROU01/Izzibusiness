import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADHESION_FEE, REFERRAL_BONUS } from '@/lib/config';
import { ERROR_CODES } from '@/lib/error-codes';
import {
  apiData,
  apiError,
  asRpcResult,
  internalError,
  readJson,
  requireProfile,
  requireUser,
} from '@/lib/api-response';
import { startCheckout } from '@/lib/payments/checkout';
import { createServiceClient } from '@/lib/supabase/server';

// GET - Statut d'adhésion, code de parrainage et filleuls de l'utilisateur connecté.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { data: profile, error } = await auth.supabase
      .from('profiles')
      .select('is_member, referral_code')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (error) return internalError('membership GET', error);

    // Les filleuls ne sont pas lisibles via RLS (profils d'autres comptes) :
    // lecture serveur restreinte au pseudo, à la date et au statut.
    let referrals: Array<{
      id: string;
      username: string;
      status: 'active' | 'pending';
      earned: number;
      createdAt: string;
    }> = [];
    if (profile?.referral_code) {
      const { data } = await createServiceClient()
        .from('profiles')
        .select('id, username, is_member, created_at')
        .eq('referred_by', profile.referral_code)
        .order('created_at', { ascending: false })
        .limit(100);
      referrals = (data ?? []).map((r) => ({
        id: r.id,
        username: r.username ?? 'membre',
        status: r.is_member ? 'active' : 'pending',
        earned: r.is_member ? REFERRAL_BONUS : 0,
        createdAt: r.created_at,
      }));
    }

    return NextResponse.json({
      adhesionFee: ADHESION_FEE,
      isMember: profile?.is_member === true,
      referralCode: profile?.referral_code ?? null,
      referrals,
    });
  } catch (error) {
    return internalError('membership GET', error);
  }
}

const paySchema = z.object({ method: z.enum(['paydunya', 'wallet']) });

// POST - Régler l'adhésion par Mobile Money (PayDunya) ou avec le solde du wallet.
export async function POST(request: Request) {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;
    if (auth.profile.isMember) {
      return apiError(ERROR_CODES.CONFLICT, 'Ton adhésion est déjà active.', 409);
    }

    const parsed = paySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Choisis un moyen de paiement.', 400);
    }

    if (parsed.data.method === 'wallet') {
      const { data, error } = await createServiceClient().rpc('pay_membership_from_wallet', {
        p_user_id: auth.user.id,
        p_fee: ADHESION_FEE,
        p_referral_bonus: REFERRAL_BONUS,
      });
      if (error) return internalError('membership wallet', error);
      const result = asRpcResult(data);
      if (!result.success) {
        return apiError(
          result.error === 'Solde insuffisant'
            ? ERROR_CODES.INSUFFICIENT_FUNDS
            : ERROR_CODES.CONFLICT,
          result.error ?? 'Paiement impossible.',
          result.error === 'Solde insuffisant' ? 402 : 409,
        );
      }
      return apiData({ status: 'active' });
    }

    const { checkoutUrl } = await startCheckout({
      requestUrl: request.url,
      userId: auth.user.id,
      kind: 'membership',
      amount: ADHESION_FEE,
      description: 'Adhésion Izzibusiness',
    });
    return apiData({ checkoutUrl });
  } catch (error) {
    return internalError('membership POST', error);
  }
}
