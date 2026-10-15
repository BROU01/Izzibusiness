import { queryOne } from '@/lib/db';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export type NotificationType =
  'info' | 'success' | 'warning' | 'error' | 'transaction' | 'game' | 'referral';

interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  /** Doublon par e-mail (si Resend est configuré). */
  sendEmail?: boolean;
}

/**
 * Crée une notification dans l'espace membre et, si demandé, l'envoie aussi
 * par e-mail. Une notification ratée ne doit jamais faire échouer l'opération
 * métier qui l'a déclenchée : les erreurs sont absorbées (null).
 */
export async function createNotification(params: NotificationParams): Promise<string | null> {
  try {
    const row = await queryOne<{ id: string }>(
      'select create_notification($1, $2, $3, $4, $5, $6) as id',
      [
        params.userId,
        params.title,
        params.message,
        params.type,
        params.actionUrl ?? null,
        JSON.stringify(params.metadata ?? {}),
      ],
    );

    if (params.sendEmail && isEmailConfigured()) {
      const user = await queryOne<{ email: string }>('select email from "user" where id = $1', [
        params.userId,
      ]);
      const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
      if (user) {
        await sendEmail({
          to: user.email,
          subject: params.title,
          paragraphs: [params.message],
          action:
            params.actionUrl && site
              ? { label: 'Ouvrir mon espace', url: `${site}${params.actionUrl}` }
              : undefined,
        });
      }
    }

    return row?.id ?? null;
  } catch {
    return null;
  }
}
