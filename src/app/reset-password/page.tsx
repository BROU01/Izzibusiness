import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe — Izzibusiness',
  robots: { index: false },
};

/**
 * Page publique ouverte depuis le lien reçu par e-mail : Better Auth y
 * renvoie avec ?token=… (ou ?error=INVALID_TOKEN si le lien a expiré).
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' && !params.error ? params.token : null;
  return <ResetPasswordForm token={token} />;
}
