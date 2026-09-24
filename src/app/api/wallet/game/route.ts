import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDemoUserByPhone, demoUnauthorized } from '@/lib/demo-auth';
import { placeDemoBet, collectDemoWin } from '@/lib/demo';

// POST - Mises et gains de jeu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, amount, game, multiplier, transactionId, phone } = body;

    // ── Mode démo ──────────────────────────────────────────────────────
    const demoUser = await getDemoUserByPhone(phone);
    if (demoUser) {
      const numericAmount = Number(amount);
      if (!action || isNaN(numericAmount) || numericAmount <= 0) {
        return NextResponse.json(
          { success: false, message: 'Données manquantes (action, amount, game)' },
          { status: 400 },
        );
      }

      if (action === 'bet') {
        const result = placeDemoBet(demoUser, numericAmount, game || 'Jeu');
        if (!result) {
          return NextResponse.json(
            { success: false, message: 'Solde insuffisant' },
            { status: 400 },
          );
        }
        return NextResponse.json({
          success: true,
          balance: result.balance,
          gameBalance: result.gameBalance,
          message: 'Mise placee',
        });
      }

      if (action === 'win' || action === 'cashout') {
        const result = collectDemoWin(demoUser, numericAmount, game || 'Jeu');
        return NextResponse.json({
          success: true,
          balance: result.balance,
          gameBalance: result.gameBalance,
          message: 'Gains encaisses',
        });
      }

      return NextResponse.json(
        { success: false, message: 'Action invalide (bet, win, cashout)' },
        { status: 400 },
      );
    }

    // ── Mode production ────────────────────────────────────────────────
    const supabase = createServerClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return demoUnauthorized();
    }

    // Validation
    if (!action || !amount || !game) {
      return NextResponse.json(
        { success: false, message: 'Données manquantes (action, amount, game)' },
        { status: 400 },
      );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    let result;

    if (action === 'bet') {
      // Placer une mise
      const { data, error } = await supabase.rpc('place_game_bet', {
        p_user_id: user.id,
        p_amount: numericAmount,
        p_game: game,
        p_metadata: JSON.stringify({ transactionId: transactionId || null }),
      });

      if (error) {
        console.error('Error placing bet:', error);
        return NextResponse.json(
          { success: false, message: 'Erreur lors de la mise' },
          { status: 500 },
        );
      }

      result = data;
    } else if (action === 'win' || action === 'cashout') {
      // Encaisser un gain
      const { data, error } = await supabase.rpc('collect_game_win', {
        p_user_id: user.id,
        p_amount: numericAmount,
        p_game: game,
        p_metadata: JSON.stringify({
          multiplier: multiplier || 1,
          transactionId: transactionId || null,
        }),
      });

      if (error) {
        console.error('Error collecting win:', error);
        return NextResponse.json(
          { success: false, message: "Erreur lors de l'encaissement" },
          { status: 500 },
        );
      }

      result = data;
    } else {
      return NextResponse.json(
        { success: false, message: 'Action invalide (bet, win, cashout)' },
        { status: 400 },
      );
    }

    if (result && result.success) {
      return NextResponse.json({
        success: true,
        balance: result.new_balance,
        gameBalance: result.game_balance,
        message: action === 'bet' ? 'Mise placee' : 'Gains encaisses',
      });
    }

    return NextResponse.json(
      { success: false, message: result?.error || "Erreur lors de l'opération" },
      { status: 400 },
    );
  } catch (error) {
    console.error('Game wallet POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// GET - Récupérer le solde de jeu
export async function GET(request: NextRequest) {
  // ── Mode démo ────────────────────────────────────────────────────────
  const phone = new URL(request.url).searchParams.get('phone');
  const demoUser = await getDemoUserByPhone(phone);
  if (demoUser) {
    return NextResponse.json({
      success: true,
      balance: demoUser.wallet.balance,
      gameBalance: demoUser.wallet.gameBalance,
      currency: demoUser.wallet.currency,
      demoMode: true,
    });
  }

  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return demoUnauthorized();
    }

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, game_balance, currency')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      return NextResponse.json({ success: false, message: 'Wallet non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      gameBalance: wallet.game_balance,
      currency: wallet.currency,
    });
  } catch (error) {
    console.error('Game wallet GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
