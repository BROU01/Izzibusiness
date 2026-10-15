import { getAuth } from '@/lib/auth';

/**
 * Points d'entrée Better Auth (liens envoyés par e-mail, rafraîchissement de
 * session). Les formulaires du site passent par nos routes /api/auth/*.
 */
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
