import { NextRequest, NextResponse } from 'next/server';
import { generateTransactionId, getWidgetConfig, verifyTransaction } from '@/lib/kkiapay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, amount, currency, paymentMethod, productName, country } = body;

    // Validation
    if (!phone || !amount || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
    }

    // Valider le montant
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    // Valider le numéro de téléphone (format sans le +)
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Numéro de téléphone invalide' },
        { status: 400 },
      );
    }

    // Générer un ID de transaction unique
    const transactionId = generateTransactionId();

    // Déterminer le mode de paiement Kkiapay
    const kkiapayMethod =
      paymentMethod === 'orange'
        ? 'momo'
        : paymentMethod === 'mtn'
          ? 'momo'
          : paymentMethod === 'wave'
            ? 'momo'
            : paymentMethod === 'moov'
              ? 'momo'
              : 'momo';

    // Déterminer le pays selon le numéro
    let kkiapayCountry = country || 'BJ'; // Par défaut Bénin
    if (cleanPhone.startsWith('225'))
      kkiapayCountry = 'CI'; // Côte d'Ivoire
    else if (cleanPhone.startsWith('221'))
      kkiapayCountry = 'SN'; // Sénégal
    else if (cleanPhone.startsWith('228'))
      kkiapayCountry = 'TG'; // Togo
    else if (cleanPhone.startsWith('227')) kkiapayCountry = 'NE'; // Niger

    // Construire la config pour le widget
    const widgetConfig = getWidgetConfig({
      amount: numericAmount,
      phone: cleanPhone,
      paymentMethod: kkiapayMethod,
      country: kkiapayCountry,
      callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/kkiapay/callback`,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      widgetConfig,
      message: 'Configuration de paiement préparée',
      // Le widget Kkiapay sera ouvert côté client avec ces paramètres
      payment: {
        amount: numericAmount,
        currency: currency || 'XOF',
        phone: cleanPhone,
        method: paymentMethod,
        country: kkiapayCountry,
        productName: productName || 'Paiement',
      },
    });
  } catch (error) {
    console.error('Kkiapay payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// Endpoint pour vérifier le statut d'un paiement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'ID de transaction requis' },
        { status: 400 },
      );
    }

    const transaction = await verifyTransaction(transactionId);

    if (transaction) {
      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.transactionId,
          amount: transaction.amount,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Transaction non trouvée' },
      { status: 404 },
    );
  } catch (error) {
    console.error('Kkiapay verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la vérification' },
      { status: 500 },
    );
  }
}
