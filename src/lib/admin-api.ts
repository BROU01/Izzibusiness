import type { NextResponse } from 'next/server';
import { requireProfile } from './api-response';

/** Garde des routes /api/admin/* : session + rôle admin vérifié en base. */
export async function requireAdmin(): Promise<
  { adminId: string; response?: never } | { adminId?: never; response: NextResponse }
> {
  const auth = await requireProfile({ admin: true });
  if (auth.response) return { response: auth.response };
  return { adminId: auth.user.id };
}
