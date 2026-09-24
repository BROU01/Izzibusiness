import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Izzibusiness — Apprendre, agir, progresser',
  description:
    'Un parcours guidé, des missions et des outils pour développer des compétences monétisables : formations, missions, marketplace et suivi de progression, à ton rythme.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
