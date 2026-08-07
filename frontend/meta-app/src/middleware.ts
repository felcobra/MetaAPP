import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de proteção de rotas — MetaAPP
 *
 * Rotas públicas (sem autenticação): "/" (login) e "/cadastro".
 * Todas as outras rotas requerem o cookie meta_session.
 *
 * O cookie é setado pelo cliente JS (api.ts → setTokens) no login
 * e limpado no logout. O middleware do Next.js opera no Edge Runtime
 * e só consegue ler cookies (não localStorage), por isso usamos esse cookie
 * como sinal de sessão ativa. A autorização real acontece no backend via JWT.
 */

const PUBLIC_ROUTES = new Set(["/", "/cadastro"]);

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Permite rotas públicas
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  // Verifica cookie de sessão
  const session = request.cookies.get("meta_session");
  if (!session?.value) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica o middleware em todas as rotas exceto assets estáticos
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
