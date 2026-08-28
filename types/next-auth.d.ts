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
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}