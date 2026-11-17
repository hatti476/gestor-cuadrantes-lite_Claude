/**
 * lib/auth/session-claims.ts
 * Revalidación del JWT de sesión contra la BD en cada petición (SPEC-011).
 * NextAuth ejecuta el callback `jwt` en cada getServerSession (todas las rutas /api,
 * que son la barrera de seguridad) y en cada GET /api/auth/session. Solo esta última
 * reescribe la cookie: en App Router getServerSession no puede, así que proxy.ts
 * (que lee la cookie con getToken) va con retraso hasta que el cliente consulta la sesión.
 */

import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { isAccountDisabled, isValidRole } from "@/lib/auth/permissions";

/**
 * Relee rol y estado del usuario del token. Usuario borrado, empleado desactivado,
 * rol desconocido o error de BD → `disabled: true` y sin rol (se deniega todo).
 */
export async function refreshTokenClaims(token: JWT): Promise<JWT> {
  // Sin id no se puede revalidar: si además trae rol, se deniega
  if (!token.id) return token.role ? { ...token, role: undefined, disabled: true } : token;

  try {
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { role: true, employee: { select: { active: true } } },
    });
    if (!user || !isValidRole(user.role) || isAccountDisabled(user.role, user.employee)) {
      return { ...token, role: undefined, disabled: true };
    }
    return { ...token, role: user.role, disabled: false };
  } catch (err) {
    console.error("[auth] Error revalidando sesión:", err);
    return { ...token, role: undefined, disabled: true };
  }
}
