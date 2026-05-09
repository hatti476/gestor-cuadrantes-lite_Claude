import { Session } from "next-auth";

// Amplía los tipos de NextAuth para incluir id y role en el objeto session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "ADMIN" | "EMPLOYEE";
    };
  }
}
