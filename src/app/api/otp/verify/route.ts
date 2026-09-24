import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/demo';

const isDev = process.env.NODE_ENV !== 'production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: 'Numero et code requis' },
        { status: 400 },
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Le code doit contenir 6 chiffres' },
        { status: 400 },
      );
    }

    // Mode developpement : accepter le code de test 000000
    if (isDev && code === '000000') {
      console.log(`[DEV MODE] OTP bypass for phone: ${phone}`);

      // Sans Supabase configuré : la vérification démo suffit, le compte
      // réel est créé par /api/auth/register juste après.
      if (!isSupabaseConfigured()) {
        return NextResponse.json({
          success: true,
          message: 'Verification reussie (mode demonstration)',
          verified: true,
          devMode: true,
        });
      }

      const supabase = createServerClient();
      await supabase.auth.signInWithOtp({ phone });

      return NextResponse.json({
        success: true,
        message: 'Verification reussie (mode developpement)',
        verified: true,
        devMode: true,
      });
    }

    const supabase = createServerClient();

    // Verifier l'OTP via Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: 'sms',
    });

    if (error) {
      console.error('Supabase verify error:', error.message);

      if (error.message.includes('expired')) {
        return NextResponse.json(
          { success: false, message: 'Le code a expire. Demandez un nouveau code.' },
          { status: 400 },
        );
      }

      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, message: 'Code invalide. Verifiez et reessayez.' },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { success: false, message: 'Erreur lors de la verification' },
        { status: 500 },
      );
    }

    if (data.session) {
      return NextResponse.json({
        success: true,
        message: 'Verification reussie',
        verified: true,
        user: {
          id: data.user?.id,
          phone: data.user?.phone,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Verification echouee', verified: false },
      { status: 400 },
    );
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
