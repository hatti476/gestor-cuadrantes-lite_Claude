import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

  // Compatibilidad: /employees/* → /admin/*
  if (pathname === "/employees" || pathname.startsWith("/employees/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/employees/, "/admin");
    return NextResponse.redirect(url);
  }

  // Proteger /admin: solo SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!token || (token as { role?: string }).role !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/login");
  // Las rutas /api/* gestionan su propia autenticación (devuelven 401/403)
  const isApiRoute = pathname.startsWith("/api/");

  if (!token && !isAuthRoute && !isApiRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
