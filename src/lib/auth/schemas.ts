import { z } from 'zod';
import { COUNTRY_CODES } from './countries';

// Messages par défaut de zod en français (champ manquant, mauvais type…).
z.config(z.locales.fr());

/** Pseudo : 3 à 20 caractères, minuscules, chiffres et « _ ». Identique à la contrainte SQL. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const PASSWORD_MIN = 8;

export const usernameSchema = z
  .string('Choisis un pseudo.')
  .trim()
  .toLowerCase()
  .regex(USERNAME_RE, 'Pseudo : 3 à 20 caractères (lettres minuscules, chiffres, _).');

export const passwordSchema = z
  .string('Choisis un mot de passe.')
  .min(PASSWORD_MIN, `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`)
  .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères.');

export const emailSchema = z
  .string('Indique ton adresse e-mail.')
  .trim()
  .toLowerCase()
  .max(120, 'Adresse e-mail trop longue.')
  .pipe(z.email('Adresse e-mail invalide.'));

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    country: z.enum(COUNTRY_CODES, 'Choisis ton pays.'),
    phone: z
      .string('Indique ton numéro de téléphone.')
      .trim()
      .min(6, 'Numéro de téléphone invalide.')
      .max(20),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^IZZ[A-Z0-9]{6}$/, 'Code de parrainage invalide.')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    password: passwordSchema,
    confirmPassword: z.string('Confirme ton mot de passe.'),
    acceptTerms: z.literal(true, 'Tu dois accepter les conditions d’utilisation.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les deux mots de passe ne correspondent pas.',
  });

export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Indique ton pseudo ou ton e-mail.').max(120),
  password: z.string().min(1, 'Indique ton mot de passe.').max(72),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les deux mots de passe ne correspondent pas.',
  });

/** Chemin de redirection interne sûr (bloque //evil.com et les schémas externes). */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback;
  }
  return raw;
}

/** Premier message d'erreur par champ, pour l'affichage sous chaque input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
