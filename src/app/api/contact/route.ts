import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { internalError } from '@/lib/api-response';
import { clientIp, hitRateLimit } from '@/lib/rate-limit';

/**
 * Réception des messages du formulaire /contact.
 *
 * Le message est inséré dans la table `contact_messages`
 * (db/migrations/001_schema.sql) pour traitement par le support.
 *
 * Champs : nom (2-80), email optionnel (5-120), message (10-2000).
 * Validation stricte : aucune donnée n'est réexpédiée telle quelle au client.
 */

const NAME_RE = /^\S[\s\S]{0,78}\S$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const { name, email, message } = (body ?? {}) as Record<string, unknown>;

  const cleanName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (!NAME_RE.test(cleanName) || cleanName.length < 2) {
    return NextResponse.json(
      { success: false, message: 'Indique ton nom (2 caractères minimum).' },
      { status: 400 },
    );
  }
  if (cleanEmail && (cleanEmail.length > 120 || !EMAIL_RE.test(cleanEmail))) {
    return NextResponse.json(
      { success: false, message: "Cette adresse email n'a pas l'air valide." },
      { status: 400 },
    );
  }
  if (cleanMessage.length < 10 || cleanMessage.length > 2000) {
    return NextResponse.json(
      { success: false, message: 'Ton message doit contenir entre 10 et 2000 caractères.' },
      { status: 400 },
    );
  }

  try {
    // Formulaire public : 5 messages par heure et par connexion.
    if (!(await hitRateLimit(`contact:${clientIp(request)}`, 5, 60 * 60))) {
      return NextResponse.json(
        { success: false, message: 'Trop de messages envoyés. Réessaie dans une heure.' },
        { status: 429 },
      );
    }

    await query('insert into contact_messages (name, email, message) values ($1, $2, $3)', [
      cleanName,
      cleanEmail || null,
      cleanMessage,
    ]);

    return NextResponse.json({
      success: true,
      message: "Message envoyé ! L'équipe te répond dans les meilleurs délais.",
    });
  } catch (error) {
    return internalError('contact POST', error);
  }
}
