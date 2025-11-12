import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/entrar', '/cadastro'];
  const privatePaths = [
    '/terapeutas',
    '/perfil',
    '/favoritos',
    '/pacientes',
    '/chamada',
    '/sessoes',
    '/cadastro-terapeuta-psicologo',
  ];

  if (userCookie) {
    if (publicPaths.some((path) => pathname === path)) {
      return NextResponse.redirect(new URL('/terapeutas', request.url));
    }

    return NextResponse.next();
  }

  if (!userCookie) {
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
    '/favoritos/:path*',
    '/pacientes/:path*',
    '/chamada/:path*',
    '/sessoes/:path*',
    '/cadastro-terapeuta-psicologo/:path*',
  ],
};
