import type { NextResponse } from 'next/server';
import { requireProfile } from './api-response';
import { createServiceClient } from './supabase/server';

/** Garde des routes /api/admin/* : session + rôle admin vérifié en base. */
export async function requireAdmin(): Promise<
  | { adminId: string; db: ReturnType<typeof createServiceClient>; response?: never }
  | { response: NextResponse }
> {
  const auth = await requireProfile({ admin: true });
  if (auth.response) return { response: auth.response };
  return { adminId: auth.user.id, db: createServiceClient() };
}
