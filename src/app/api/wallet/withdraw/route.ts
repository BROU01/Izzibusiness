import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import {
  apiData,
  apiError,
  asRpcResult,
  internalError,
  readJson,
  requireProfile,
  requireUser,
} from '@/lib/api-response';
import { MIN_WITHDRAWAL, WITHDRAWAL_FEE_RATE, WITHDRAW_OPERATORS, formatFcfa } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase/server';

const schema = z.object({
  amount: z.coerce
    .number('Montant invalide.')
    .int('Montant entier en FCFA.')
    .min(MIN_WITHDRAWAL, `Retrait minimum : ${formatFcfa(MIN_WITHDRAWAL)}.`),
  operator: z.string().min(3).max(40),
});

/**
 * POST - Demande de retrait (adhérents). Le montant et les frais sont
 * bloqués immédiatement ; l'envoi Mobile Money part après validation admin.
 * Le versement se fait uniquement vers le numéro du compte : un compte
 * piraté ne peut pas vider le solde vers un autre numéro.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireProfile({ member: true });
    if (auth.response) return auth.response;

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    const operators = WITHDRAW_OPERATORS[auth.profile.country ?? ''] ?? [];
    const operator = operators.find((o) => o.mode === parsed.data.operator);
    if (!operator) {
      return apiError(
        ERROR_CODES.INVALID_PAYLOAD,
        'Cet opérateur n’est pas disponible pour ton pays.',
        400,
      );
    }
    if (!auth.profile.phone) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Aucun numéro enregistré sur ton compte.', 400);
    }

    const amount = parsed.data.amount;
    const fee = Math.ceil(amount * WITHDRAWAL_FEE_RATE);

    const { data, error } = await createServiceClient().rpc('request_withdrawal', {
      p_user_id: auth.user.id,
      p_amount: amount,
      p_fee: fee,
      p_phone: auth.profile.phone,
      p_mode: operator.mode,
    });
    if (error) return internalError('withdraw POST', error);

    const result = asRpcResult(data);
    if (!result.success) {
      const insufficient = result.error === 'Solde insuffisant';
      return apiError(
        insufficient ? ERROR_CODES.INSUFFICIENT_FUNDS : ERROR_CODES.CONFLICT,
        insufficient
          ? `Solde insuffisant : il faut ${formatFcfa(amount + fee)} (montant + frais).`
          : (result.error ?? 'Retrait impossible.'),
        insufficient ? 402 : 409,
      );
    }

    return apiData(
      {
        withdrawalId: result.withdrawal_id,
        amount,
        fee,
        newBalance: Number(result.new_balance),
      },
      201,
    );
  } catch (error) {
    return internalError('withdraw POST', error);
  }
}

// GET - Retraits de l'utilisateur connecté.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { data, error } = await auth.supabase
      .from('withdrawals')
      .select('id, amount, fee, withdraw_mode, status, admin_note, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return internalError('withdraw GET', error);

    return NextResponse.json({
      success: true,
      withdrawals: (data ?? []).map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        fee: Number(w.fee),
        operator: w.withdraw_mode,
        status: w.status,
        note: w.status === 'rejected' || w.status === 'failed' ? w.admin_note : null,
        createdAt: w.created_at,
      })),
    });
  } catch (error) {
    return internalError('withdraw GET', error);
  }
}
