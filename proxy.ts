import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import auth_config from "./auth_config";
import { rateLimit } from "./lib/rate-limit";

const { auth } = NextAuth(auth_config);

export const config = {
  matcher: ["/admin/:path*", "/product", "/course", "/blog", "/auth", "/api/:path*"],
};

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/") || pathname.startsWith("/admin") || pathname === "/auth") {
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = forwardedFor || req.headers.get("x-real-ip") || "unknown";
    const limiter = rateLimit(`sensitive:${clientKey}`, 120, 60 * 1000);
    if (!limiter.allowed) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(limiter.retryAfter) },
      });
    }
  }
  const user = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    raw: false,
    cookieName: "user",
  });
  const isLogged = Boolean(user);
  const authRoute = "/auth";

  if (pathname === "/product") {
    return NextResponse.redirect(new URL("/products", req.url));
  }
  if (pathname === "/course") {
    return NextResponse.redirect(new URL("/courses", req.url));
  }
  if (pathname === "/blog") {
    return NextResponse.redirect(new URL("/blogs", req.url));
  }

  if (isLogged && pathname === authRoute) {
    return NextResponse.redirect(new URL("/courses", req.url));
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminRoute && (!isLogged || user?.role !== "admin")) {
    return NextResponse.redirect(new URL("/courses", req.url));
  }

  return NextResponse.next();
});
