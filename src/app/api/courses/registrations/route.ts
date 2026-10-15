import { z } from 'zod';
import { apiData, apiError, internalError, readJson, requireUser } from '@/lib/api-response';
import { queryOne } from '@/lib/db';
import { ERROR_CODES } from '@/lib/error-codes';
import { hitRateLimit } from '@/lib/rate-limit';

/**
 * Demande d'inscription à une formation pour l'utilisateur connecté.
 * L'identifiant vient de la session, jamais du body ; le statut est toujours « new ».
 */

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} : ${min} caractères minimum.`)
    .max(max, `${label} : ${max} caractères maximum.`);

const registrationSchema = z.object({
  fullName: trimmed(2, 80, 'Nom complet'),
  phone: trimmed(6, 20, 'Contact'),
  goal: z
    .string()
    .trim()
    .max(1000, 'Objectif : 1000 caractères maximum.')
    .optional()
    .transform((value) => (value ? value : null)),
  level: z.enum(['debutant', 'intermediaire', 'avance']),
  formation: trimmed(1, 80, 'Formation'),
  paymentMethod: z.enum(['orange', 'mtn', 'moov', 'wave']).optional(),
});

const MAX_REGISTRATIONS_PER_HOUR = 5;

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const parsed = registrationSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(
      ERROR_CODES.INVALID_PAYLOAD,
      parsed.error.issues[0]?.message ?? 'Formulaire invalide.',
      400,
    );
  }
  const input = parsed.data;

  try {
    const allowed = await hitRateLimit(
      `course-registration:${auth.user.id}`,
      MAX_REGISTRATIONS_PER_HOUR,
      3600,
    );
    if (!allowed) {
      return apiError(
        ERROR_CODES.RATE_LIMITED,
        'Trop de demandes envoyées. Réessaie dans une heure.',
        429,
      );
    }

    const row = await queryOne<{ id: string; created_at: Date }>(
      `insert into course_registrations
         (user_id, full_name, phone, goal, level, formation, payment_method, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'new')
       returning id, created_at`,
      [
        auth.user.id,
        input.fullName,
        input.phone,
        input.goal,
        input.level,
        input.formation,
        input.paymentMethod ?? null,
      ],
    );
    return apiData({ id: row?.id ?? null, createdAt: row?.created_at.toISOString() ?? null }, 201);
  } catch (error) {
    return internalError('courses/registrations:post', error);
  }
}
