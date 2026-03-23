import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ACCESS = new Set(["premium", "business", "trial"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/room/")) {
    const access = request.cookies.get("instanttalk_access")?.value;

    if (!access || !ALLOWED_ACCESS.has(access)) {
      const url = request.nextUrl.clone();
      url.pathname = "/pricing";
      url.searchParams.set("source", "room");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/room/:path*"]
};
