import type { Metadata } from 'next';
import { Suspense } from 'react';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Mot de passe oublié — Izzibusiness',
  description: 'Reçois un lien par e-mail pour choisir un nouveau mot de passe.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
