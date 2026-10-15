import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Inscription — Izzibusiness',
  description:
    'Crée ton compte Izzibusiness : ouvre ta boutique, vends tes produits et suis tes gains.',
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
