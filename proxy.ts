import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth/permissions";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

  // Compatibilidad: /employees y /employees/* → /admin (la gestión de empleados,
  // rotación e historial vive en /admin; /admin/* no existe — SPEC-010 H-02/H-03)
  if (pathname === "/employees" || pathname.startsWith("/employees/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Proteger /admin: solo ADMIN (misma regla que lib/auth/permissions.ts)
  if (pathname.startsWith("/admin")) {
    if (!token || !isAdminRole((token as { role?: string }).role)) {
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
