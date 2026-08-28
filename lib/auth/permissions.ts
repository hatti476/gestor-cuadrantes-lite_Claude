/**
 * lib/auth/permissions.ts
 * Funciones puras de autorización. Sin dependencias de BD ni HTTP.
 * Sistema simplificado: tres roles globales sin contexto de proyecto.
 * 
 * ADMIN    → acceso completo (lectura/escritura todo)
 * TECNICO  → solo lectura; ve cuadrante solo si publicado
 * VIEWER   → solo lectura; ve cuadrante solo si publicado
 */

import type { Session } from "next-auth";

/** Roles globales válidos */
export const ROLES = ["ADMIN", "TECNICO", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

// Sesión tipada con nuestros roles (se extiende via types/next-auth.d.ts)
type ExtendedSession = Session & {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
};

function getRole(session: Session | null): Role | undefined {
  return (session as ExtendedSession)?.user?.role;
}

/**
 * Verifica si el usuario es ADMIN
 */
export function isAdmin(session: Session | null): boolean {
  return getRole(session) === "ADMIN";
}

/**
 * Verifica si el usuario es TECNICO
 */
export function isTecnico(session: Session | null): boolean {
  return getRole(session) === "TECNICO";
}

/**
 * Verifica si el usuario es VIEWER
 */
export function isViewer(session: Session | null): boolean {
  return getRole(session) === "VIEWER";
}

/**
 * Verifica si el usuario es TECNICO o VIEWER (roles de solo lectura)
 * RF-05: TECNICO y VIEWER son estrictamente read-only
 */
export function isReadOnlyRole(session: Session | null): boolean {
  return isTecnico(session) || isViewer(session);
}

/**
 * RF-04: ADMIN tiene acceso completo a todas las operaciones de lectura y escritura
 */
export function canEditSchedule(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * RF-05: TECNICO y VIEWER son estrictamente de solo lectura.
 * Cualquier intento de escritura debe retornar 403.
 */
export function canWrite(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * RF-06: TECNICO y VIEWER solo ven el cuadrante cuando Schedule.published === true.
 * ADMIN ve siempre (publicado o no).
 */
export function canViewSchedules(session: Session | null, published: boolean): boolean {
  if (!session) return false;
  if (isAdmin(session)) return true;
  return published && isReadOnlyRole(session);
}

/**
 * Helper para UI: true si el rol debe ver solo contenido publicado (TECNICO, VIEWER)
 */
export function canViewPublishedOnly(session: Session | null): boolean {
  return isReadOnlyRole(session);
}

/**
 * RF-04: Solo ADMIN puede gestionar empleados
 */
export function canManageEmployees(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * RF-04: Solo ADMIN puede gestionar festivos
 */
export function canManageHolidays(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * TECNICO, VIEWER y ADMIN pueden ver festivos (lectura)
 */
export function canViewHolidays(session: Session | null): boolean {
  if (!session) return false;
  return isAdmin(session) || isTecnico(session) || isViewer(session);
}

/**
 * Validación de rol válido
 */
export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}

/**
 * Obtiene el rol de la sesión de forma segura
 */
export function getSessionRole(session: Session | null): Role | null {
  const role = getRole(session);
  return role && isValidRole(role) ? role : null;
}