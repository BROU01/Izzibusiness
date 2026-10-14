'use client';

import { useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  email: string | null;
  username: string | null;
  role: 'user' | 'admin';
  isMember: boolean;
  referralCode: string | null;
  country: string | null;
  phone: string | null;
  isBanned: boolean;
}

export type SessionState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'anonymous'; user: null };

/**
 * Utilisateur connecté, lu depuis /api/auth/me (session cookie httpOnly).
 * Sert à l'affichage uniquement : la protection réelle est faite par le
 * proxy (src/proxy.ts) et par chaque route API.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const payload = (await response.json().catch(() => null)) as {
          data?: SessionUser;
        } | null;
        if (cancelled) return;
        if (response.ok && payload?.data) {
          setState({ status: 'authenticated', user: payload.data });
        } else {
          setState({ status: 'anonymous', user: null });
        }
      } catch {
        if (!cancelled) setState({ status: 'anonymous', user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Déconnexion : supprime les cookies de session côté serveur. */
export async function signOut(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
}
