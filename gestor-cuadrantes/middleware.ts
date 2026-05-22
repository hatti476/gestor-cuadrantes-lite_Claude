import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware de Next.js para:
 * 1. Redirigir /employees → /admin (compatibilidad de bookmarks)
 * 2. Proteger /admin — solo accesible para SUPER_ADMIN
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Compatibilidad: /employees redirige a /admin
  if (pathname === "/employees" || pathname.startsWith("/employees/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/employees/, "/admin");
    return NextResponse.redirect(url);
  }

  // Proteger /admin: solo SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req });
    if (!token || token.role !== "SUPER_ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employees/:path*", "/admin/:path*"],
};
