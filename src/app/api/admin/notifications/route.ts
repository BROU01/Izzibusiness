import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';
import { query } from '@/lib/db';

const schema = z.object({
  title: z.string().trim().min(3, 'Titre : 3 caractères minimum.').max(120),
  message: z.string().trim().min(5, 'Message : 5 caractères minimum.').max(1000),
  audience: z.enum(['all', 'members']),
});

// POST - Annonce envoyée dans les notifications de tous les comptes (ou des adhérents).
export async function POST(request: Request) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    // Une seule insertion ensembliste : pas de liste de destinataires en mémoire.
    const rows = await query<{ sent: number }>(
      `with inserted as (
         insert into notifications (user_id, title, message, type)
         select p.id, $1, $2, 'info'
           from profiles p
          where not p.is_banned and ($3::boolean = false or p.is_member)
         returning 1
       )
       select count(*)::int as sent from inserted`,
      [parsed.data.title, parsed.data.message, parsed.data.audience === 'members'],
    );
    return apiData({ sent: rows[0]?.sent ?? 0 });
  } catch (error) {
    return internalError('admin broadcast', error);
  }
}
