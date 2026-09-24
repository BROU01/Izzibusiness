import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createNotification, NOTIFICATION_TEMPLATES } from '@/lib/notifications';

const KKIAPAY_API_URL = 'https://api.kkiapay.me';
const KKIAPAY_PRIVATE_KEY = process.env.KKIAPAY_PRIVATE_KEY || '';
const KKIAPAY_SECRET_KEY = process.env.KKIAPAY_SECRET_KEY || '';

// POST - Callback Kkiapay apres paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, status, amount, phone } = body;

    console.log('[Kkiapay Callback]', { transactionId, status, amount, phone });

    // Verifier que le paiement est reussi
    if (status !== 'SUCCESS' && status !== 'successful') {
      console.log('[Kkiapay Callback] Paiement echoue:', status);
      return NextResponse.json({ success: true, message: 'Paiement non reussi' });
    }

    const supabase = createServerClient();

    // Trouver la transaction en attente
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference_id', transactionId)
      .eq('status', 'pending')
      .single();

    if (txError || !tx) {
      console.log('[Kkiapay Callback] Transaction non trouvee ou deja traitee:', transactionId);
      return NextResponse.json({ success: true, message: 'Transaction deja traitee' });
    }

    const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
    const depositAmount = metadata.amount || amount;

    // Crediter le wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', tx.user_id)
      .single();

    if (walletError || !wallet) {
      console.error('[Kkiapay Callback] Wallet non trouve:', tx.user_id);
      return NextResponse.json({ success: false, message: 'Wallet non trouve' });
    }

    const newBalance = wallet.balance + depositAmount;

    // Mettre a jour le wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', tx.user_id);

    if (updateError) {
      console.error('[Kkiapay Callback] Erreur maj wallet:', updateError);
      return NextResponse.json({ success: false, message: 'Erreur mise a jour wallet' });
    }

    // Mettre a jour la transaction
    const { error: txUpdateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        balance_after: newBalance,
      })
      .eq('id', tx.id);

    if (txUpdateError) {
      console.error('[Kkiapay Callback] Erreur maj transaction:', txUpdateError);
    }

    // Creer une notification
    const providerNames: Record<string, string> = {
      orange: 'Orange Money',
      mtn: 'MTN MoMo',
      wave: 'Wave',
      moov: 'Moov Money',
    };
    const providerName = providerNames[metadata.provider] || metadata.provider || 'Mobile Money';
    const notifTemplate = NOTIFICATION_TEMPLATES.depositSuccess(depositAmount, providerName);
    await createNotification({
      userId: tx.user_id,
      ...notifTemplate,
    });

    console.log('[Kkiapay Callback] Depot confirme:', {
      transactionId,
      amount: depositAmount,
      newBalance,
    });

    return NextResponse.json({ success: true, message: 'Depot confirme' });
  } catch (error) {
    console.error('[Kkiapay Callback] Erreur:', error);
    return NextResponse.json({ success: false, message: 'Erreur interne' });
  }
}

// GET - Verification manuelle d'un paiement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'transactionId requis' },
        { status: 400 },
      );
    }

    // Verifier le statut via l'API Kkiapay
    const response = await fetch(`${KKIAPAY_API_URL}/api/v1/transactions/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'x-private-key': KKIAPAY_PRIVATE_KEY,
        'x-secret-key': KKIAPAY_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Impossible de verifier le paiement' },
        { status: 502 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionId,
        status: data.status,
        amount: data.amount,
      },
    });
  } catch (error) {
    console.error('[Kkiapay Verify] Erreur:', error);
    return NextResponse.json({ success: false, message: 'Erreur interne' });
  }
}
