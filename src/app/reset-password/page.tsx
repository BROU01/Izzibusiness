import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe — Izzibusiness',
  robots: { index: false },
};

// Accès protégé par le proxy (src/proxy.ts) : nécessite la session ouverte par le lien e-mail.
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
