import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const isDev = process.env.NODE_ENV !== 'production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Numero de telephone requis' },
        { status: 400 },
      );
    }

    // Valider le format du numero (commence par + suivi de chiffres)
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format de numero invalide. Utilisez le format international: +22890123456',
        },
        { status: 400 },
      );
    }

    // Mode developpement : simuler l'envoi sans SMS
    if (isDev) {
      console.log(`[DEV MODE] OTP simulated for phone: ${phone}`);
      console.log(`[DEV MODE] Use code 000000 to verify`);

      return NextResponse.json({
        success: true,
        message: 'Code OTP envoye (mode developpement)',
        devMode: true,
        hint: 'Utilisez le code 000000 pour verifier',
      });
    }

    const supabase = createServerClient();

    // Envoyer l'OTP via Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      console.error('Supabase OTP error:', error.message);

      // Messages d'erreur personnalises
      if (error.message.includes('over')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Trop de tentatives. Attendez quelques minutes avant de reessayer.',
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { success: false, message: "Erreur lors de l'envoi du code. Reessayez." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code OTP envoye avec succes',
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
