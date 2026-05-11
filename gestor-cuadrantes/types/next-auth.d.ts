import { Session } from "next-auth";
import type { ProjectMembership } from "@/lib/auth/permissions";

// Amplía los tipos de NextAuth para incluir id, role y projectMemberships
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      /** Rol global: SUPER_ADMIN | USER */
      role: "SUPER_ADMIN" | "USER";
      /** Membresías de proyecto (cargadas en el callback session) */
      projectMemberships: ProjectMembership[];
    };
  }
}
