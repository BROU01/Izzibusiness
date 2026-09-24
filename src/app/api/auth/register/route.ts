import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createNotification, NOTIFICATION_TEMPLATES } from '@/lib/notifications';
import { isSupabaseConfigured, createDemoUser, getDemoUser } from '@/lib/demo';
import { ADHESION_FEE } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, referralCode } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'Nom et telephone requis' },
        { status: 400 },
      );
    }

    const cleanPhone = phone.replace(/\s+/g, '');

    // ── Mode démo (Supabase non configuré) ──────────────────────────────
    if (!isSupabaseConfigured()) {
      const existing = getDemoUser(cleanPhone);
      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'Compte existant, connexion reussie',
          userId: existing.id,
          demoMode: true,
        });
      }
      // Résout le code de parrainage (code ou téléphone du parrain).
      const user = createDemoUser(name, cleanPhone, referralCode || null);
      return NextResponse.json({
        success: true,
        message: 'Compte cree avec succes (mode demonstration)',
        userId: user.id,
        demoMode: true,
        adhesionFee: ADHESION_FEE,
      });
    }

    // ── Mode production (Supabase configuré) ────────────────────────────
    const supabase = createServerClient();

    // Verifier si l'utilisateur existe deja
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Compte existant, connexion reussie',
        userId: existingUser.id,
      });
    }

    // Creer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        name,
        email: email || null,
        phone: cleanPhone,
        role: 'user',
      })
      .select('id')
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la creation du compte' },
        { status: 500 },
      );
    }

    // Creer le wallet pour l'utilisateur
    await supabase.from('wallets').insert({
      user_id: profile.id,
      balance: 0,
      game_balance: 0,
    });

    // Envoyer la notification de bienvenue
    await createNotification({
      userId: profile.id,
      ...NOTIFICATION_TEMPLATES.welcome(name),
    });

    return NextResponse.json({
      success: true,
      message: 'Compte cree avec succes',
      userId: profile.id,
      adhesionFee: ADHESION_FEE,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
