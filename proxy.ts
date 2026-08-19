import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const voted = /(?:^|; )vote_done=1(?:;|$)/.test(cookie);
  const isVoterBallot =
    url.pathname === "/vote" || url.pathname === "/vote/";

  if (voted && isVoterBallot) {
    return NextResponse.redirect(new URL("/vote/receipt", request.url));
  }

  if (!url.pathname.startsWith("/admin")) return NextResponse.next();
  if (url.pathname.startsWith("/admin/login")) return NextResponse.next();

  const match = cookie.match(/(?:^|; )staff_session=([^;]+)/);
  if (!match) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    await jwtVerify(
      decodeURIComponent(match[1]),
      new TextEncoder().encode(process.env.SESSION_SECRET || ""),
    );
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/vote", "/vote/:path*"],
};
