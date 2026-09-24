import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getDemoUser, createDemoUser } from '@/lib/demo';

/**
 * Identité de démo : sans Supabase, le téléphone EST le compte.
 * Les routes appellent ce helper APRÈS avoir lu leur body/searchParams
 * (le helper ne consomme jamais lui-même le flux de la requête).
 *
 * Renvoie l'utilisateur démo ou null (hors mode démo).
 */
export async function getDemoUserByPhone(phone: string | null | undefined) {
  if (isSupabaseConfigured()) return null;
  if (!phone) return null;
  let user = getDemoUser(phone);
  if (!user) {
    // Auto-création : permet de tester le dashboard sans repasser par /register.
    user = createDemoUser(`Utilisateur ${phone.replace(/\D/g, '').slice(-4)}`, phone, null);
  }
  return user;
}

export function demoUnauthorized() {
  return NextResponse.json(
    { success: false, message: 'Session de démonstration introuvable. Reconnectez-vous.' },
    { status: 401 },
  );
}
