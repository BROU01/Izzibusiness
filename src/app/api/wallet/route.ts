import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDemoUserByPhone, demoUnauthorized } from '@/lib/demo-auth';

// GET - Récupérer le wallet de l'utilisateur
export async function GET(request: NextRequest) {
  // ── Mode démo ────────────────────────────────────────────────────────
  const phone = new URL(request.url).searchParams.get('phone');
  const demoUser = await getDemoUserByPhone(phone);
  if (demoUser) {
    return NextResponse.json({
      success: true,
      wallet: {
        balance: demoUser.wallet.balance,
        gameBalance: demoUser.wallet.gameBalance,
        currency: demoUser.wallet.currency,
      },
      isMember: demoUser.isMember,
      demoMode: true,
    });
  }

  try {
    const supabase = createServerClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return demoUnauthorized();
    }

    // Récupérer le wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Si le wallet n'existe pas, le créer
    if (walletError && walletError.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: user.id, balance: 0, game_balance: 0 })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return NextResponse.json(
          { success: false, message: 'Erreur lors de la création du wallet' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        wallet: {
          balance: newWallet.balance,
          gameBalance: newWallet.game_balance,
          currency: newWallet.currency,
        },
      });
    }

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la récupération du wallet' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        gameBalance: wallet.game_balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
