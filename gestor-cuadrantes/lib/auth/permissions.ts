/**
 * lib/auth/permissions.ts
 * Funciones puras de autorización. Sin dependencias de BD ni HTTP.
 * Usan el objeto Session de NextAuth extendido con globalRole y projectMemberships.
 */

import type { Session } from "next-auth";

/** Roles globales */
export const GLOBAL_ROLES = ["SUPER_ADMIN", "USER"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

/** Roles dentro de un proyecto */
export const PROJECT_ROLES = ["PROJECT_ADMIN", "EMPLOYEE"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

/** Tipo extendido de la sesión con datos de proyecto */
export interface ProjectMembership {
  projectId: string;
  role: ProjectRole;
}

/**
 * El usuario es SUPER_ADMIN (acceso total a todos los proyectos).
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === "SUPER_ADMIN";
}

/**
 * El usuario es PROJECT_ADMIN en el proyecto indicado,
 * o es SUPER_ADMIN (que tiene permisos en todos los proyectos).
 */
export function isProjectAdmin(
  session: Session | null,
  projectId: string
): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;

  const memberships = (session.user as unknown as { projectMemberships?: ProjectMembership[] })
    .projectMemberships ?? [];

  return memberships.some(
    (m) => m.projectId === projectId && m.role === "PROJECT_ADMIN"
  );
}

/**
 * El usuario puede ver el proyecto (es miembro con cualquier rol,
 * o es SUPER_ADMIN).
 */
export function canViewProject(
  session: Session | null,
  projectId: string
): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;

  const memberships = (session.user as unknown as { projectMemberships?: ProjectMembership[] })
    .projectMemberships ?? [];

  return memberships.some((m) => m.projectId === projectId);
}

/**
 * Devuelve true si la sesión tiene rol de administración
 * (SUPER_ADMIN globalmente o PROJECT_ADMIN en cualquier proyecto).
 * Útil para verificar acceso genérico a rutas de gestión.
 */
export function hasAdminAccess(session: Session | null): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;

  const memberships = (session.user as unknown as { projectMemberships?: ProjectMembership[] })
    .projectMemberships ?? [];

  return memberships.some((m) => m.role === "PROJECT_ADMIN");
}
