import { Resend } from 'resend';

/**
 * Envoi d'e-mails transactionnels (réinitialisation du mot de passe…) via Resend.
 * RESEND_API_KEY : clé API Resend. EMAIL_FROM : expéditeur d'un domaine vérifié
 * chez Resend, ex. "Izzibusiness <no-reply@izzibusiness.com>".
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Envoi d’e-mails non configuré (RESEND_API_KEY / EMAIL_FROM).');
    this.name = 'EmailNotConfiguredError';
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  /** Paragraphes en texte brut (échappés avant insertion dans le HTML). */
  paragraphs: string[];
  action?: { label: string; url: string };
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new EmailNotConfiguredError();

  const body = params.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const button = params.action
    ? `<p><a href="${escapeHtml(params.action.url)}" style="display:inline-block;padding:12px 20px;background:#ffe500;color:#14120d;border:3px solid #14120d;font-weight:700;text-decoration:none">${escapeHtml(params.action.label)}</a></p><p style="font-size:12px;color:#57534a">Lien direct : ${escapeHtml(params.action.url)}</p>`
    : '';
  const text = [
    ...params.paragraphs,
    params.action ? `${params.action.label} : ${params.action.url}` : '',
  ].join('\n\n');

  const { error } = await new Resend(key).emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: `<div style="font-family:Georgia,serif;color:#14120d;max-width:520px">${body}${button}<p style="font-size:12px;color:#57534a">Izzibusiness</p></div>`,
    text,
  });
  if (error) throw new Error(`Resend : ${error.message}`);
}
