import { NextRequest, NextResponse } from 'next/server';
import { createDeposit } from '@/lib/pawapay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, amount, currency, paymentMethod, productName } = body;

    // Validation
    if (!phone || !amount || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
    }

    // Générer un token unique pour cette transaction
    const tokenId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initier le paiement via PawaPay
    const result = await createDeposit({
      tokenId,
      amount: amount.toString(),
      currency: currency || 'XOF',
      paymentMethod,
      reason: `Paiement: ${productName}`,
      metadata: {
        phone,
        productName,
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        depositId: result.depositId,
        status: result.status,
        message: 'Paiement initié avec succès',
        paymentUrl: result.paymentUrl,
      });
    }

    return NextResponse.json({ success: false, message: result.message }, { status: 500 });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
