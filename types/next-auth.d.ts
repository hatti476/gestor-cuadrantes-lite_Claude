// types/next-auth.d.ts
// Extensión de tipos de NextAuth para el nuevo sistema de roles

import "next-auth";
import { Role } from "@/lib/auth/permissions";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      /** undefined si la sesión ha sido deshabilitada (SPEC-011) */
      role?: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    /** Sin rol si la revalidación lo deshabilita (SPEC-011) */
    role?: Role;
    /** true si el usuario ya no existe o está desactivado (SPEC-011) */
    disabled?: boolean;
  }
}