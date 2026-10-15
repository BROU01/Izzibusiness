import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, internalError, readJson, requireUser } from '@/lib/api-response';
import { query, queryOne } from '@/lib/db';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  created_at: Date;
}

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

    const [rows, unread] = await Promise.all([
      query<NotificationRow>(
        `select id, title, message, type, read, action_url, created_at
           from notifications
          where user_id = $1 and ($2::boolean is false or read = false)
          order by created_at desc
          limit $3`,
        [auth.user.id, parsed.data.unread === 'true', parsed.data.limit],
      ),
      queryOne<{ count: number }>(
        'select count(*)::int as count from notifications where user_id = $1 and read = false',
        [auth.user.id],
      ),
    ]);

    return NextResponse.json({
      success: true,
      notifications: rows.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        actionUrl: n.action_url,
        createdAt: n.created_at.toISOString(),
      })),
      unreadCount: unread?.count ?? 0,
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

    if ('notificationId' in parsed.data) {
      await query('update notifications set read = true where id = $1 and user_id = $2', [
        parsed.data.notificationId,
        auth.user.id,
      ]);
    } else {
      await query('update notifications set read = true where user_id = $1 and read = false', [
        auth.user.id,
      ]);
    }
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

    await query('delete from notifications where id = $1 and user_id = $2', [
      id.data,
      auth.user.id,
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalError('notifications DELETE', error);
  }
}
