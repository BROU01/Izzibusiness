import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDemoUserByPhone, demoUnauthorized } from '@/lib/demo-auth';
import { creditDemo, pushDemoNotification } from '@/lib/demo';
import { MIN_DEPOSIT } from '@/lib/config';

const KKIAPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '';

// POST - Initier un depot via Kkiapay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, phone, provider, demoPhone } = body;

    // Validation
    if (!amount || !phone || !provider) {
      return NextResponse.json(
        { success: false, message: 'Donnees manquantes (amount, phone, provider)' },
        { status: 400 },
      );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    if (numericAmount < MIN_DEPOSIT) {
      return NextResponse.json(
        { success: false, message: `Le montant minimum est de ${MIN_DEPOSIT} FCFA` },
        { status: 400 },
      );
    }

    const validProviders = ['orange', 'mtn', 'wave', 'moov'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ success: false, message: 'Provider invalide' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\s+/g, '').replace(/^\+/, '');
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Numero de telephone invalide' },
        { status: 400 },
      );
    }

    // ── Mode démo : crédit immédiat simulé ─────────────────────────────
    const demoUser = await getDemoUserByPhone(demoPhone || phone);
    if (demoUser) {
      const depositId = `dep_${Date.now().toString(36)}`;
      const tx = creditDemo(
        demoUser,
        numericAmount,
        'deposit',
        `Depot ${provider.toUpperCase()} via ${cleanPhone}`,
      );
      tx.referenceId = depositId;
      pushDemoNotification(demoUser, {
        title: 'Depot recu',
        message: `Votre depot de ${numericAmount.toLocaleString('fr-FR')} FCFA via ${provider} a ete credite sur votre wallet.`,
        type: 'transaction',
        actionUrl: '/dashboard/wallet',
      });
      return NextResponse.json({
        success: true,
        depositId,
        simulated: true,
        newBalance: demoUser.wallet.balance,
        message: 'Depot credite (mode demonstration)',
      });
    }

    // ── Mode production ────────────────────────────────────────────────
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return demoUnauthorized();
    }

    // Generer un token unique pour cette transaction
    const depositId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Creer un enregistrement de transaction en attente
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: numericAmount,
      balance_after: 0, // Sera mis a jour apres confirmation
      description: `Depot ${provider.toUpperCase()} via ${cleanPhone}`,
      reference_id: depositId,
      status: 'pending',
      metadata: JSON.stringify({
        provider,
        phone: cleanPhone,
        amount: numericAmount,
        depositId,
      }),
    });

    if (txError) {
      console.error('Error creating deposit record:', txError);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la creation du depot' },
        { status: 500 },
      );
    }

    // Retourner les informations pour le widget Kkiapay
    return NextResponse.json({
      success: true,
      depositId,
      widgetConfig: {
        amount: numericAmount,
        key: KKIAPAY_PUBLIC_KEY,
        phone: cleanPhone,
        paymentmethod: 'momo',
        countries: getCountryFromPhone(cleanPhone),
        sandbox: process.env.NODE_ENV !== 'production',
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/wallet/deposit/callback`,
        position: 'center',
        theme: '#6366f1',
      },
      message: 'Configuration du paiement prete',
    });
  } catch (error) {
    console.error('Deposit POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// GET - Verifier le statut d'un depot
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Non authentifie' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ success: false, message: 'depositId requis' }, { status: 400 });
    }

    const { data: tx, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('reference_id', depositId)
      .single();

    if (error || !tx) {
      return NextResponse.json(
        { success: false, message: 'Transaction non trouvee' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: tx.reference_id,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.created_at,
      },
    });
  } catch (error) {
    console.error('Deposit GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// Determiner le pays a partir du numero de telephone
function getCountryFromPhone(phone: string): string {
  if (phone.startsWith('225')) return 'CI';
  if (phone.startsWith('228')) return 'TG';
  if (phone.startsWith('221')) return 'SN';
  if (phone.startsWith('227')) return 'NE';
  if (phone.startsWith('237')) return 'CM';
  if (phone.startsWith('229')) return 'BJ';
  return 'BJ'; // Par defaut Benin
}
