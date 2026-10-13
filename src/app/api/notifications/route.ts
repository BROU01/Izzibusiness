import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, internalError, readJson, requireUser } from '@/lib/api-response';

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(['true', 'false']).optional(),
});

const updateSchema = z.union([
  z.object({ markAllRead: z.literal(true) }),
  z.object({ notificationId: z.uuid() }),
]);

// GET - Notifications de l'utilisateur connecté.
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = listSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Paramètres invalides.', 400);
    }

    let query = auth.supabase
      .from('notifications')
      .select('id, title, message, type, read, action_url, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit);
    if (parsed.data.unread === 'true') query = query.eq('read', false);

    const [{ data, error }, { count }] = await Promise.all([
      query,
      auth.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
        .eq('read', false),
    ]);
    if (error) return internalError('notifications GET', error);

    return NextResponse.json({
      success: true,
      notifications: (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        actionUrl: n.action_url,
        createdAt: n.created_at,
      })),
      unreadCount: count ?? 0,
    });
  } catch (error) {
    return internalError('notifications GET', error);
  }
}

// PUT - Marquer une notification (ou toutes) comme lue(s).
export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = updateSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'notificationId ou markAllRead requis.', 400);
    }

    let query = auth.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', auth.user.id);
    query =
      'notificationId' in parsed.data
        ? query.eq('id', parsed.data.notificationId)
        : query.eq('read', false);

    const { error } = await query;
    if (error) return internalError('notifications PUT', error);
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalError('notifications PUT', error);
  }
}

// DELETE - Supprimer une notification.
export async function DELETE(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const id = z.uuid().safeParse(new URL(request.url).searchParams.get('id'));
    if (!id.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Identifiant de notification invalide.', 400);
    }

    const { error } = await auth.supabase
      .from('notifications')
      .delete()
      .eq('id', id.data)
      .eq('user_id', auth.user.id);
    if (error) return internalError('notifications DELETE', error);
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalError('notifications DELETE', error);
  }
}
