/**
 * URL publique du site pour les liens envoyés par e-mail (confirmation,
 * réinitialisation). NEXT_PUBLIC_APP_URL est prioritaire : l'en-tête Host
 * de la requête est contrôlable par le client et ne doit pas finir dans un
 * lien d'e-mail.
 */
export function getSiteUrl(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, '');
  return new URL(requestUrl).origin;
}
