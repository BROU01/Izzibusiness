import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDemoUserByPhone, demoUnauthorized } from '@/lib/demo-auth';

// GET - Récupérer l'historique des transactions
export async function GET(request: NextRequest) {
  // ── Mode démo ────────────────────────────────────────────────────────
  const phone = new URL(request.url).searchParams.get('phone');
  const demoUser = await getDemoUserByPhone(phone);
  if (demoUser) {
    return NextResponse.json({
      success: true,
      transactions: demoUser.transactions,
      total: demoUser.transactions.length,
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

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // Filtrer par type optionnel

    // Construire la requête
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error: txError, count } = await query;

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la récupération des transactions' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      transactions: (transactions || []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balance_after,
        description: tx.description,
        referenceId: tx.reference_id,
        status: tx.status,
        createdAt: tx.created_at,
      })),
      total: count || 0,
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
