import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDemoUserByPhone, demoUnauthorized } from '@/lib/demo-auth';

// GET - Recuperer les notifications
export async function GET(request: NextRequest) {
  // ── Mode démo ────────────────────────────────────────────────────────
  const demoPhone = new URL(request.url).searchParams.get('phone');
  const demoUser = await getDemoUserByPhone(demoPhone);
  if (demoUser) {
    const unreadCount = demoUser.notifications.filter((n) => !n.read).length;
    return NextResponse.json({
      success: true,
      notifications: demoUser.notifications,
      unreadCount,
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la recuperation' },
        { status: 500 },
      );
    }

    // Compter les non-lues
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      success: true,
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        actionUrl: n.action_url,
        createdAt: n.created_at,
      })),
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// PUT - Marquer comme lu
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllRead, phone } = body;

    // ── Mode démo ──────────────────────────────────────────────────────
    const demoUser = await getDemoUserByPhone(phone);
    if (demoUser) {
      if (markAllRead) {
        demoUser.notifications.forEach((n) => (n.read = true));
      } else if (notificationId) {
        const notif = demoUser.notifications.find((n) => n.id === notificationId);
        if (notif) notif.read = true;
      }
      return NextResponse.json({ success: true, demoMode: true });
    }

    // ── Mode production ────────────────────────────────────────────────
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return demoUnauthorized();
    }

    if (markAllRead) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        return NextResponse.json(
          { success: false, message: 'Erreur lors de la mise a jour' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Toutes les notifications marquees comme lues',
      });
    }

    if (notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json(
          { success: false, message: 'Erreur lors de la mise a jour' },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, message: 'Notification marquee comme lue' });
    }

    return NextResponse.json(
      { success: false, message: 'notificationId ou markAllRead requis' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

// DELETE - Supprimer une notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const demoPhone = searchParams.get('phone');

    // ── Mode démo ──────────────────────────────────────────────────────
    const demoUser = await getDemoUserByPhone(demoPhone);
    if (demoUser) {
      demoUser.notifications = demoUser.notifications.filter((n) => n.id !== notificationId);
      return NextResponse.json({ success: true, demoMode: true });
    }

    // ── Mode production ────────────────────────────────────────────────
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return demoUnauthorized();
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'ID de notification requis' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la suppression' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: 'Notification supprimee' });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
