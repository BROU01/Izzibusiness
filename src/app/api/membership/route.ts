import { NextRequest, NextResponse } from 'next/server';
import { getDemoUserByPhone } from '@/lib/demo-auth';
import { payDemoMembership } from '@/lib/demo';
import { ADHESION_FEE } from '@/lib/config';

export async function GET(request: NextRequest) {
  // ── Mode démo ────────────────────────────────────────────────────────
  const phone = new URL(request.url).searchParams.get('phone');
  const demoUser = await getDemoUserByPhone(phone);
  if (demoUser) {
    return NextResponse.json({
      adhesionFee: ADHESION_FEE,
      isMember: demoUser.isMember,
      paidAt: demoUser.isMember ? new Date().toISOString() : null,
      referralCode: demoUser.referralCode,
      referrals: demoUser.referrals,
      demoMode: true,
    });
  }

  // Production : le statut réel doit venir de Supabase (auth session).
  return NextResponse.json({
    adhesionFee: ADHESION_FEE,
    isMember: false,
    paidAt: null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, provider, demoPhone } = body;

    if (!phone || !provider) {
      return NextResponse.json({ error: 'Telephone et fournisseur requis' }, { status: 400 });
    }

    // ── Mode démo : adhésion validée immédiatement ─────────────────────
    const demoUser = await getDemoUserByPhone(demoPhone || phone);
    if (demoUser) {
      const result = payDemoMembership(demoUser, provider, phone);
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Adhesion confirmee',
        amount: ADHESION_FEE,
        membership: result.membership,
        newBalance: result.newBalance,
        demoMode: true,
      });
    }

    // Production :
    // 1. Créer l'enregistrement d'adhésion dans Supabase
    // 2. Initier le paiement Kkiapay pour ADHESION_FEE FCFA
    // 3. Renvoyer la config widget
    return NextResponse.json({
      success: true,
      message: 'Adhesion initiee',
      amount: ADHESION_FEE,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
