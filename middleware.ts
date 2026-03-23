import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/room/")) {
    const access = request.cookies.get("instanttalk_access")?.value;

    if (!access) {
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