import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ACCESS = new Set(["premium", "business", "trial", "enterprise"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Route de callback Stripe — jamais bloquée ────────────────────────────
  // Cette route SET les cookies et redirige, elle ne doit jamais être interceptée.
  if (pathname.startsWith("/api/auth/callback/stripe")) {
    return NextResponse.next();
  }

  // ── Protection des salles de réunion ─────────────────────────────────────
  if (pathname.startsWith("/room/")) {
    // Dev : bypass total pour les tests locaux
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    // Invités avec token valide → accès libre (pas d'abonnement requis)
    const isGuest = request.nextUrl.searchParams.get("guest") === "1";
    const hasToken = !!request.nextUrl.searchParams.get("t");
    if (isGuest && hasToken) {
      return NextResponse.next();
    }

    const access = request.cookies.get("instanttalk_access")?.value;

    // Accès valide → laisser passer
    if (access && ALLOWED_ACCESS.has(access)) {
      return NextResponse.next();
    }

    // Pas d'accès → rediriger vers la page de tarifs
    const url = request.nextUrl.clone();
    url.pathname = "/pricing";
    url.searchParams.set("source", "room");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/room/:path*", "/api/auth/callback/stripe"],
};
