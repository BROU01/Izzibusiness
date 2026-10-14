import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, asRpcResult, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';
import { createNotification } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('set_member'), value: z.boolean() }),
  z.object({ action: z.literal('set_role'), value: z.enum(['user', 'admin']) }),
  z.object({ action: z.literal('set_banned'), value: z.boolean() }),
  z.object({
    action: z.literal('adjust_balance'),
    amount: z.coerce
      .number()
      .int()
      .refine((n) => n !== 0, 'Montant non nul requis.'),
    reason: z.string().trim().min(5, 'Motif obligatoire (5 caractères minimum).').max(200),
  }),
]);

// POST - Actions admin sur un compte.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Compte invalide.', 400);
    }
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }
    const input = parsed.data;

    if (id === guard.adminId && (input.action === 'set_role' || input.action === 'set_banned')) {
      return apiError(
        ERROR_CODES.FORBIDDEN,
        'Tu ne peux pas modifier ton propre rôle ni te bannir.',
        403,
      );
    }

    if (input.action === 'adjust_balance') {
      const { data, error } = await guard.db.rpc('admin_adjust_balance', {
        p_user_id: id,
        p_amount: input.amount,
        p_reason: input.reason,
        p_admin: guard.adminId,
      });
      if (error) return internalError('admin adjust', error);
      const result = asRpcResult(data);
      if (!result.success) {
        return apiError(ERROR_CODES.CONFLICT, result.error ?? 'Ajustement refusé.', 409);
      }
      return apiData({ balance: Number(result.new_balance) });
    }

    const update =
      input.action === 'set_member'
        ? { is_member: input.value }
        : input.action === 'set_role'
          ? { role: input.value }
          : { is_banned: input.value };

    const { error } = await guard.db.from('profiles').update(update).eq('id', id);
    if (error) return internalError('admin user update', error);

    if (input.action === 'set_member' && input.value) {
      await createNotification({
        userId: id,
        title: 'Adhésion activée',
        message: 'Ton adhésion a été activée par l’équipe.',
        type: 'success',
        actionUrl: '/dashboard',
      });
    }
    return apiData({ updated: true });
  } catch (error) {
    return internalError('admin user', error);
  }
}
