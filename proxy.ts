import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import auth_config from "./auth_config";

const { auth } = NextAuth(auth_config);

export const config = {
  matcher: ["/admin/:path*", "/product", "/course", "/blog", "/auth"],
};

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;
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
