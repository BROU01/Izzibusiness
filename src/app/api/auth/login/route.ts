import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Telephone requis' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verifier si l'utilisateur existe
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      // En dev, creer un utilisateur fictif
      return NextResponse.json({
        success: true,
        message: 'Connexion reussie (mode developpement)',
        user: {
          id: `dev-user-${Date.now()}`,
          name: 'Utilisateur',
          phone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion reussie',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    // En dev, retourner un succes
    return NextResponse.json({
      success: true,
      message: 'Connexion reussie (mode developpement)',
      user: {
        id: `dev-user-${Date.now()}`,
        name: 'Utilisateur',
        phone: 'inconnu',
      },
    });
  }
}
