import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "@/lib/auth/permissions";
import { authorizeCredentials } from "@/lib/auth/authorize";
import { refreshTokenClaims } from "@/lib/auth/session-claims";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Login: authorize ya ha validado credenciales, rol y estado
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.disabled = false;
        return token;
      }
      // Resto de peticiones: el rol y el estado se releen de BD (SPEC-011)
      return refreshTokenClaims(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Sesión deshabilitada → sin rol: todas las comprobaciones de permisos dan false
        session.user.role = token.disabled ? undefined : token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };