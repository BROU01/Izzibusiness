'use client';

import { useEffect, useState } from 'react';
import { getDemoPhone } from '@/lib/demo-client';

interface AuthUser {
  id: string;
}

function toAuthUser(phone: string | null): AuthUser | null {
  return phone ? { id: `demo-${phone}` } : null;
}

/**
 * Minimal client-side auth state.
 *
 * Demo mode identifies the current user by phone number (see `demo-auth.ts`
 * which derives the user id from the phone). This hook only exposes the
 * stable `id` needed for analytics / payment payloads.
 */
export function useAuth(): { user: AuthUser | null } {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(toAuthUser(getDemoPhone()));

    sync();

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.includes('phone')) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { user };
}

/**
 * Convenience helper: stable callback that returns the current demo phone
 * or null, without subscribing to re-renders.
 */
export function useDemoPhone() {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setPhone(getDemoPhone());
    read();

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.includes('phone')) read();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return phone;
}

export default useAuth;
