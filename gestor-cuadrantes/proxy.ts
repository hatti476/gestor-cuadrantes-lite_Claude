import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  // Las rutas /api/* gestionan su propia autenticación (devuelven 401/403)
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (!token && !isAuthRoute && !isApiRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
