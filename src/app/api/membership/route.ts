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
import { callFunction, query, queryOne } from '@/lib/db';

// GET - Statut d'adhésion, code de parrainage et filleuls de l'utilisateur connecté.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const profile = await queryOne<{ is_member: boolean; referral_code: string | null }>(
      'select is_member, referral_code from profiles where id = $1',
      [auth.user.id],
    );

    // Filleuls (profils d'autres comptes) : uniquement pseudo, date et statut.
    let referrals: Array<{
      id: string;
      username: string;
      status: 'active' | 'pending';
      earned: number;
      createdAt: string;
    }> = [];
    if (profile?.referral_code) {
      const rows = await query<{
        id: string;
        username: string | null;
        is_member: boolean;
        created_at: Date;
      }>(
        `select p.id, u.username, p.is_member, p.created_at
           from profiles p
           join "user" u on u.id = p.id
          where p.referred_by = $1
          order by p.created_at desc
          limit 100`,
        [profile.referral_code],
      );
      referrals = rows.map((r) => ({
        id: r.id,
        username: r.username ?? 'membre',
        status: r.is_member ? 'active' : 'pending',
        earned: r.is_member ? REFERRAL_BONUS : 0,
        createdAt: r.created_at.toISOString(),
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
      const data = await callFunction('pay_membership_from_wallet', [
        auth.user.id,
        ADHESION_FEE,
        REFERRAL_BONUS,
      ]);
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
