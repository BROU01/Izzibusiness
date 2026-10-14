import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, asRpcResult, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';
import { payWithdrawal, refreshWithdrawalStatus } from '@/lib/payments/withdrawals';
import { createNotification } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pay') }),
  z.object({ action: z.literal('refresh') }),
  z.object({
    action: z.literal('reject'),
    note: z.string().trim().min(5, 'Motif obligatoire (5 caractères minimum).').max(500),
  }),
]);

// POST - Payer (déboursement PayDunya), refuser (remboursement) ou relire le statut.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Retrait invalide.', 400);
    }
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    if (parsed.data.action === 'pay') {
      const result = await payWithdrawal({
        withdrawalId: id,
        adminId: guard.adminId,
        requestUrl: request.url,
      });
      return apiData(result);
    }

    if (parsed.data.action === 'refresh') {
      const status = await refreshWithdrawalStatus({ withdrawalId: id }, guard.adminId);
      return apiData({ status });
    }

    const { data: row } = await guard.db
      .from('withdrawals')
      .select('user_id, amount')
      .eq('id', id)
      .maybeSingle();
    const { data, error } = await guard.db.rpc('refund_withdrawal', {
      p_id: id,
      p_status: 'rejected',
      p_note: parsed.data.note,
      p_admin: guard.adminId,
    });
    if (error) return internalError('admin withdrawal reject', error);
    const result = asRpcResult(data);
    if (!result.success) {
      return apiError(ERROR_CODES.CONFLICT, result.error ?? 'Refus impossible.', 409);
    }
    if (row) {
      await createNotification({
        userId: row.user_id,
        title: 'Retrait refusé',
        message: `Ton retrait a été refusé (${parsed.data.note}). Le montant et les frais sont revenus sur ton wallet.`,
        type: 'warning',
        actionUrl: '/dashboard/wallet',
      });
    }
    return apiData({ status: 'rejected' });
  } catch (error) {
    return internalError('admin withdrawal', error);
  }
}
