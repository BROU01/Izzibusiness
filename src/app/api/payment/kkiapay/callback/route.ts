import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/lib/kkiapay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, signature } = body;

    if (!transactionId || !signature) {
      return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier et traiter le callback
    const result = await handleCallback(transactionId, signature);

    if (result.success) {
      // TODO: Mettre à jour la base de données avec le statut du paiement
      // TODO: Envoyer une notification à l'utilisateur
      // TODO: Libérer le produit/service acheté

      console.log(`Payment successful: ${transactionId}`);

      return NextResponse.json({
        success: true,
        message: 'Paiement confirmé',
        transaction: result.transaction,
      });
    }

    console.log(`Payment failed or pending: ${transactionId}`);

    return NextResponse.json({
      success: false,
      message: 'Paiement non confirmé',
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Kkiapay callback error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du traitement du callback' },
      { status: 500 },
    );
  }
}
