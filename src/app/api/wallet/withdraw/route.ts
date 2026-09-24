import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDemoUserByPhone, demoUnauthorized } from '@/lib/demo-auth';
import { withdrawDemo } from '@/lib/demo';
import { MIN_WITHDRAWAL, WITHDRAWAL_FEE_RATE } from '@/lib/config';

// POST - Initier un retrait Mobile Money
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, phone: payoutPhone, provider } = body;

    // Validation commune
    if (!amount || !payoutPhone || !provider) {
      return NextResponse.json(
        { success: false, message: 'Donnees manquantes (amount, phone, provider)' },
        { status: 400 },
      );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    if (numericAmount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        {
          success: false,
          message: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL.toLocaleString('fr-FR')} FCFA`,
        },
        { status: 400 },
      );
    }

    const validProviders = ['orange', 'mtn', 'wave', 'moov'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ success: false, message: 'Provider invalide' }, { status: 400 });
    }

    const cleanPhone = String(payoutPhone).replace(/\s+/g, '').replace(/^\+/, '');
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Numero de telephone invalide' },
        { status: 400 },
      );
    }

    // ── Mode démo ──────────────────────────────────────────────────────
    const demoUser = await getDemoUserByPhone(body.demoPhone);
    if (demoUser) {
      const result = withdrawDemo(demoUser, numericAmount, provider, cleanPhone);
      if ('error' in result) {
        return NextResponse.json({ success: false, message: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Retrait initie avec succes',
        withdrawal: result.withdrawal,
        newBalance: result.newBalance,
        demoMode: true,
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

    // Verifier le solde
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ success: false, message: 'Wallet non trouve' }, { status: 404 });
    }

    // Calculer les frais
    const fees = Math.ceil(numericAmount * WITHDRAWAL_FEE_RATE);
    const totalDebit = numericAmount + fees;

    if (wallet.balance < totalDebit) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde insuffisant. Montant: ${numericAmount} FCFA + frais: ${fees} FCFA = ${totalDebit} FCFA`,
        },
        { status: 400 },
      );
    }

    // Generer un ID de transaction unique
    const withdrawalId = `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Debit du wallet (montant + frais)
    const { data: newWallet, error: debitError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance - totalDebit })
      .eq('user_id', user.id)
      .select('balance')
      .single();

    if (debitError) {
      console.error('Error debiting wallet:', debitError);
      return NextResponse.json(
        { success: false, message: 'Erreur lors du debit' },
        { status: 500 },
      );
    }

    // Enregistrer la transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdraw',
      amount: -totalDebit,
      balance_after: newWallet.balance,
      description: `Retrait ${provider.toUpperCase()} vers ${cleanPhone}`,
      reference_id: withdrawalId,
      status: 'pending',
      metadata: JSON.stringify({
        provider,
        phone: cleanPhone,
        amount: numericAmount,
        fees,
        withdrawalId,
      }),
    });

    if (txError) {
      console.error('Error recording transaction:', txError);
      // Annuler le debit en cas d'erreur
      await supabase.from('wallets').update({ balance: wallet.balance }).eq('user_id', user.id);

      return NextResponse.json(
        { success: false, message: "Erreur lors de l'enregistrement" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Retrait initie avec succes',
      withdrawal: {
        id: withdrawalId,
        amount: numericAmount,
        fees,
        total: totalDebit,
        phone: cleanPhone,
        provider,
        status: 'pending',
        estimatedTime: '1-24 heures',
      },
      newBalance: newWallet.balance,
    });
  } catch (error) {
    console.error('Withdraw POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// GET - Historique des retraits
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
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data: withdrawals, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'withdraw')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la recuperation' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      withdrawals: (withdrawals || []).map((tx) => ({
        id: tx.reference_id,
        amount: Math.abs(tx.amount),
        description: tx.description,
        status: tx.status,
        createdAt: tx.created_at,
        metadata: tx.metadata ? JSON.parse(tx.metadata) : {},
      })),
    });
  } catch (error) {
    console.error('Withdraw GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
