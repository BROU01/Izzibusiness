import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, asRpcResult, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';
import { createNotification } from '@/lib/notifications';
import { formatFcfa } from '@/lib/config';
import { callFunction } from '@/lib/db';

const schema = z
  .object({ approve: z.boolean(), note: z.string().trim().max(500).optional() })
  .refine((v) => v.approve || (v.note && v.note.length >= 5), {
    message: 'Un motif (5 caractères minimum) est obligatoire pour refuser.',
  });

// POST - Valider (récompense créditée) ou refuser une preuve de mission.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Soumission invalide.', 400);
    }
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    const data = await callFunction('review_mission_submission', [
      id,
      parsed.data.approve,
      parsed.data.note ?? null,
      guard.adminId,
    ]);
    const result = asRpcResult(data);
    if (!result.success) {
      return apiError(ERROR_CODES.CONFLICT, result.error ?? 'Action impossible.', 409);
    }

    await createNotification({
      userId: String(result.user_id),
      title: parsed.data.approve ? 'Mission validée' : 'Mission refusée',
      message: parsed.data.approve
        ? `${formatFcfa(Number(result.reward))} ont été crédités sur ton wallet.`
        : `Ta preuve a été refusée : ${parsed.data.note}`,
      type: parsed.data.approve ? 'success' : 'warning',
      actionUrl: '/dashboard/missions',
    });
    return apiData({ status: parsed.data.approve ? 'approved' : 'rejected' });
  } catch (error) {
    return internalError('admin submission', error);
  }
}
