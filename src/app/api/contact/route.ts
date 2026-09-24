import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/demo';

/**
 * Réception des messages du formulaire /contact.
 *
 * Mode démo (Supabase non configuré) : le message est journalisé côté serveur
 * et accusé réception renvoyé — le parcours utilisateur reste complet.
 * Mode production : le message est inséré dans la table `contact_messages`
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

  // ── Mode démo : accusé de réception sans persistance ───────────────────
  if (!isSupabaseConfigured()) {
    console.log('[CONTACT - demo]', {
      name: cleanName,
      email: cleanEmail || null,
      length: cleanMessage.length,
      at: new Date().toISOString(),
    });
    return NextResponse.json({
      success: true,
      message:
        'Message reçu (mode démonstration). En production, il est enregistré et traité par le support.',
      demoMode: true,
    });
  }

  // ── Mode production : persistance Supabase ─────────────────────────────
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('contact_messages').insert({
      name: cleanName,
      email: cleanEmail || null,
      message: cleanMessage,
    });

    if (error) {
      console.error('Contact insert error:', error);
      return NextResponse.json(
        { success: false, message: "Impossible d'enregistrer ton message. Réessaie." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message envoyé ! L'équipe te répond dans les meilleurs délais.",
    });
  } catch (error) {
    console.error('Contact route error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne. Réessaie plus tard.' },
      { status: 500 },
    );
  }
}
