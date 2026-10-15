import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Connexion — Izzibusiness',
  description: 'Connecte-toi à ton espace Izzibusiness avec ton pseudo ou ton e-mail.',
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
