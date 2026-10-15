import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins/username';
import { nextCookies } from 'better-auth/next-js';
import { getPool, queryOne } from './db';
import { sendEmail } from './email';
import { USERNAME_RE } from './auth/schemas';

/**
 * Authentification Better Auth (tables "user", "session", "account",
 * "verification" dans la base Neon, voir db/migrations/001_schema.sql).
 *
 * Monté sur /api/better-auth/* (route catch-all) : nos propres routes
 * /api/auth/* (inscription, connexion…) appellent auth.api côté serveur.
 *
 * Variables : BETTER_AUTH_SECRET (32+ caractères aléatoires),
 * NEXT_PUBLIC_APP_URL (URL publique du site), DATABASE_URL.
 */

export const AUTH_BASE_PATH = '/api/better-auth';
export const AUTH_COOKIE_PREFIX = 'izzi';

function createAuth() {
  return betterAuth({
    appName: 'Izzibusiness',
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    basePath: AUTH_BASE_PATH,
    secret: process.env.BETTER_AUTH_SECRET,
    database: getPool(),
    telemetry: { enabled: false },
    advanced: { cookiePrefix: AUTH_COOKIE_PREFIX },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // Session signée en cookie 5 min : le proxy ne touche pas la base à
      // chaque page. Les routes API revérifient le profil (bannissement) en base.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 72,
      autoSignIn: true,
      // Un lien de réinitialisation déconnecte les autres appareils.
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: 'Réinitialise ton mot de passe Izzibusiness',
          paragraphs: [
            'Tu as demandé à changer ton mot de passe.',
            'Ce lien est valable une heure. Si tu n’es pas à l’origine de la demande, ignore cet e-mail : ton mot de passe actuel reste valable.',
          ],
          action: { label: 'Choisir un nouveau mot de passe', url },
        });
      },
    },
    databaseHooks: {
      session: {
        create: {
          // Un compte suspendu par l'admin ne peut plus ouvrir de session.
          before: async (session) => {
            const row = await queryOne<{ is_banned: boolean }>(
              'select is_banned from profiles where id = $1',
              [session.userId],
            );
            if (row?.is_banned) return false;
          },
        },
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 20,
        usernameValidator: (value) => USERNAME_RE.test(value),
      }),
      // Doit rester le dernier plugin : écrit les cookies dans les routes Next.
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { izziAuth?: Auth };

/** Instance unique, créée au premier usage (pas au build). */
export function getAuth(): Auth {
  if (!globalForAuth.izziAuth) globalForAuth.izziAuth = createAuth();
  return globalForAuth.izziAuth;
}
