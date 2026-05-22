import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // Sin adapter: usamos JWT puro con CredentialsProvider.
  // El adapter de Prisma se añadirá cuando migremos a OAuth o sesiones en BD.
  session: {
    // JWT permite usar CredentialsProvider sin necesidad de tabla Session en BD
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] Credenciales vacías");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("[auth] Usuario encontrado:", user?.email ?? "ninguno");

          if (!user || !user.password) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("[auth] Password match:", passwordMatch);

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (err) {
          console.error("[auth] Error en authorize:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // En el primer login 'user' contiene los datos devueltos por authorize()
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      // Cargar membresías de proyecto desde BD en cada refresco de token
      if (token.id) {
        try {
          const memberships = await prisma.projectMember.findMany({
            where: { userId: token.id as string },
            select: { projectId: true, role: true },
          });
          token.projectMemberships = memberships;
        } catch {
          token.projectMemberships = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Propagamos id, role y projectMemberships al objeto session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SUPER_ADMIN" | "SUPER_VIEWER" | "USER";
        session.user.projectMemberships = (token.projectMemberships ?? []) as import("@/lib/auth/permissions").ProjectMembership[];
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
