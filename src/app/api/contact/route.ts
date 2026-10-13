import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { internalError } from '@/lib/api-response';

/**
 * Réception des messages du formulaire /contact.
 *
 * Le message est inséré dans la table `contact_messages`
 * (migration 003_create_contact_messages.sql) pour traitement par le support.
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
    const supabase = await createClient();
    const { error } = await supabase.from('contact_messages').insert({
      name: cleanName,
      email: cleanEmail || null,
      message: cleanMessage,
    });

    if (error) return internalError('contact POST', error);

    return NextResponse.json({
      success: true,
      message: "Message envoyé ! L'équipe te répond dans les meilleurs délais.",
    });
  } catch (error) {
    return internalError('contact POST', error);
  }
}
