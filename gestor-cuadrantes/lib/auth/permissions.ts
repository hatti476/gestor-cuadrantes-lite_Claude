/**
 * lib/auth/permissions.ts
 * Funciones puras de autorización. Sin dependencias de BD ni HTTP.
 * Usan el objeto Session de NextAuth extendido con globalRole y projectMemberships.
 */

import type { Session } from "next-auth";

/** Roles globales */
export const GLOBAL_ROLES = ["SUPER_ADMIN", "SUPER_VIEWER", "USER"] as const;
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
 * El usuario es SUPER_VIEWER: puede ver todos los proyectos y cuadrantes
 * pero no puede realizar ninguna acción de escritura.
 */
export function isSuperViewer(session: Session | null): boolean {
  return session?.user?.role === "SUPER_VIEWER";
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
 * SUPER_ADMIN o SUPER_VIEWER).
 */
export function canViewProject(
  session: Session | null,
  projectId: string
): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  if (isSuperViewer(session)) return true;

  const memberships = (session.user as unknown as { projectMemberships?: ProjectMembership[] })
    .projectMemberships ?? [];

  return memberships.some((m) => m.projectId === projectId);
}

/**
 * El usuario puede editar el proyecto (SUPER_ADMIN o PROJECT_ADMIN).
 * SUPER_VIEWER siempre devuelve false.
 */
export function canEditProject(
  session: Session | null,
  projectId: string
): boolean {
  if (!session) return false;
  if (isSuperViewer(session)) return false;
  return isProjectAdmin(session, projectId);
}

/**
 * Devuelve true si la sesión tiene rol de administración
 * (SUPER_ADMIN globalmente o PROJECT_ADMIN en cualquier proyecto).
 * SUPER_VIEWER nunca tiene acceso de administración.
 */
export function hasAdminAccess(session: Session | null): boolean {
  if (!session) return false;
  if (isSuperViewer(session)) return false;
  if (isSuperAdmin(session)) return true;

  const memberships = (session.user as unknown as { projectMemberships?: ProjectMembership[] })
    .projectMemberships ?? [];

  return memberships.some((m) => m.role === "PROJECT_ADMIN");
}

/**
 * Devuelve true si el usuario es PROJECT_ADMIN en al menos un proyecto.
 * Útil para determinar accesos intermedios (festivos, empleados, historial).
 */
export function isAnyProjectAdmin(session: Session | null): boolean {
  if (!session) return false;
  const memberships = (session.user as unknown as { projectMemberships?: ProjectMembership[] })
    .projectMemberships ?? [];
  return memberships.some((m) => m.role === "PROJECT_ADMIN");
}

/**
 * El usuario puede ver la lista de empleados.
 * Roles permitidos: SUPER_ADMIN, SUPER_VIEWER, PROJECT_ADMIN (en cualquier proyecto).
 * Los VIEWER (USER sin rol de administración de proyecto) NO tienen acceso.
 */
export function canViewEmployees(session: Session | null): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  if (isSuperViewer(session)) return true;
  return isAnyProjectAdmin(session);
}

/**
 * El usuario puede ver los festivos.
 * Roles permitidos: SUPER_ADMIN, SUPER_VIEWER, PROJECT_ADMIN (en cualquier proyecto).
 * Los VIEWER (USER sin rol de administración de proyecto) NO tienen acceso.
 */
export function canViewHolidays(session: Session | null): boolean {
  return canViewEmployees(session);
}

/**
 * El usuario puede gestionar (crear/eliminar) festivos.
 * Solo SUPER_ADMIN.
 */
export function canManageHolidays(session: Session | null): boolean {
  return isSuperAdmin(session);
}

/**
 * El usuario puede gestionar los miembros de un proyecto (añadir / eliminar).
 * Según la matriz de permisos: solo SUPER_ADMIN.
 */
export function canManageProjectMembers(session: Session | null): boolean {
  return isSuperAdmin(session);
}
