/**
 * lib/auth/authorize.ts
 * Validación de credenciales para el CredentialsProvider de NextAuth.
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAccountDisabled, type Role } from "@/lib/auth/permissions";

export interface AuthorizedUser {
  id: string;
  email: string;
  role: Role;
}

export async function authorizeCredentials(
  credentials: { email?: string; password?: string } | undefined
): Promise<AuthorizedUser | null> {
  if (!credentials?.email || !credentials?.password) {
    console.log("[auth] Credenciales vacías");
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      // El alta guarda el email en minúsculas (app/api/admin/users/route.ts)
      where: { email: credentials.email.toLowerCase() },
      select: { id: true, email: true, password: true, role: true, employee: { select: { active: true } } },
    });
    // Log de diagnóstico: permitió encontrar la causa raíz de CP-171 en CI
    console.log("[auth] Usuario encontrado:", user?.email ?? "ninguno");
    if (!user || !user.password) return null;

    const passwordMatch = await bcrypt.compare(credentials.password, user.password);
    console.log("[auth] Password match:", passwordMatch);
    if (!passwordMatch) return null;

    // Un empleado desactivado conserva sus datos pero no puede entrar (SPEC-010 H-12)
    if (isAccountDisabled(user.role, user.employee)) {
      console.log("[auth] Empleado desactivado:", user.email);
      return null;
    }

    return { id: user.id, email: user.email, role: user.role as Role };
  } catch (err) {
    console.error("[auth] Error en authorize:", err);
    return null;
  }
}
