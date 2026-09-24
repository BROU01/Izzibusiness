'use client';

/**
 * Identité de démonstration côté client.
 *
 * Sans backend configuré, le téléphone sert d'identifiant de session démo :
 * il est stocké après l'inscription/OTP et transmis aux API (paramètre
 * `phone` ou `demoPhone`). En production avec Supabase, ces API utilisent
 * la session cookie et ignorent ce paramètre.
 */

const DEMO_PHONE_KEY = 'izzibusiness-demo-phone';

export function setDemoPhone(phone: string): void {
  try {
    window.localStorage.setItem(DEMO_PHONE_KEY, phone);
  } catch {
    // Stockage indisponible (navigation privée) : la session démo ne
    // survivra pas au rechargement, acceptable en mode démo.
  }
}

export function getDemoPhone(): string | null {
  try {
    return window.localStorage.getItem(DEMO_PHONE_KEY);
  } catch {
    return null;
  }
}

export function clearDemoPhone(): void {
  try {
    window.localStorage.removeItem(DEMO_PHONE_KEY);
  } catch {
    // Ignoré.
  }
}
