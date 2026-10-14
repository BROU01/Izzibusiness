import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicEnv } from './env';

/**
 * Pages réservées aux comptes connectés. Restent publiques : l'accueil,
 * /about, /contact, /terms, /privacy et les pages d'accès.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/reset-password',
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

/**
 * Rafraîchit la session Supabase (cookies) et applique les gardes de route.
 * La garde serveur remplace l'ancienne vérification localStorage, que
 * n'importe qui pouvait contourner.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED_PREFIXES);
  const env = getSupabasePublicEnv();

  if (!env) {
    return isProtected ? redirectTo(request, '/login', true) : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser revalide le jeton auprès de Supabase : ne pas le remplacer par getSession.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    return redirectTo(request, '/login', true);
  }

  if (user && matches(pathname, GUEST_ONLY)) {
    return redirectTo(request, '/dashboard', false);
  }

  if (user && matches(pathname, ADMIN_PREFIXES)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      return redirectTo(request, '/dashboard', false);
    }
  }

  return response;
}
