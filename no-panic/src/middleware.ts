import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/entrar', '/cadastro'];
  const privatePaths = ['/terapeutas', '/perfil', '/configuracoes'];

  // ======== USUÁRIO LOGADO ========
  if (userCookie) {
    // Evita loop — só redireciona se tentar acessar rota pública
    if (publicPaths.some((path) => pathname === path)) {
      return NextResponse.redirect(new URL('/terapeutas', request.url));
    }
    // deixa acessar qualquer outra (privada ou pública fora da lista)
    return NextResponse.next();
  }

  // ======== USUÁRIO NÃO LOGADO ========
  if (!userCookie) {
    // Evita loop — só redireciona se tentar acessar rota privada
    if (privatePaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/entrar',
    '/cadastro',
    '/terapeutas/:path*',
    '/perfil/:path*',
    '/configuracoes/:path*',
  ],
};
