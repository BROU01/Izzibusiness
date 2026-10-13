import { NextResponse } from 'next/server';
import { ADHESION_FEE, REFERRAL_BONUS } from '@/lib/config';
import { internalError, requireUser } from '@/lib/api-response';
import { paymentsUnavailable } from '@/lib/payments-status';
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

// POST - Paiement de l'adhésion : suspendu jusqu'à l'intégration PayDunya.
export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    return paymentsUnavailable();
  } catch (error) {
    return internalError('membership POST', error);
  }
}
