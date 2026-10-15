import { NextResponse, type NextRequest } from 'next/server';
import { getMemberProfile, getSessionUser } from '@/lib/session';

/**
 * Garde de routes serveur. Pages réservées aux comptes connectés ; restent
 * publiques : l'accueil, /about, /contact, /terms, /privacy, les pages
 * d'accès et /reset-password (lien reçu par e-mail).
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/games',
  '/formations',
  '/formation-ia',
  '/market',
  '/leaderboard',
];
/** Pages réservées aux administrateurs (rôle vérifié en base). */
const ADMIN_PREFIXES = ['/admin'];
/** Pages d'accès : inutiles une fois connecté. */
const GUEST_ONLY = ['/login', '/register', '/forgot-password'];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectTo(request: NextRequest, pathname: string, withReturn: boolean) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (withReturn) {
    url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  }
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED_PREFIXES);
  const isGuestOnly = matches(pathname, GUEST_ONLY);
  if (!isProtected && !isGuestOnly) return NextResponse.next();

  // Session signée vérifiée par Better Auth (cookie, puis base si besoin).
  const user = await getSessionUser(request.headers).catch(() => null);

  if (!user && isProtected) return redirectTo(request, '/login', true);
  if (user && isGuestOnly) return redirectTo(request, '/dashboard', false);

  if (user && matches(pathname, ADMIN_PREFIXES)) {
    const profile = await getMemberProfile(user.id).catch(() => null);
    if (profile?.role !== 'admin' || profile.isBanned) {
      return redirectTo(request, '/dashboard', false);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Toutes les pages sauf assets statiques et routes API (qui vérifient
    // elles-mêmes la session et renvoient 401 en JSON plutôt qu'une redirection).
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
