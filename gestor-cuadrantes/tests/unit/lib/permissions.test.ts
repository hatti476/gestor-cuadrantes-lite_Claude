import { describe, it, expect } from "vitest";
import {
  isSuperAdmin,
  isProjectAdmin,
  canViewProject,
  hasAdminAccess,
  GLOBAL_ROLES,
  PROJECT_ROLES,
} from "@/lib/auth/permissions";
import type { Session } from "next-auth";
import type { ProjectMembership } from "@/lib/auth/permissions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSession(
  role: string,
  memberships: ProjectMembership[] = []
): Session {
  return {
    user: {
      id: "user-1",
      email: "test@cuadrantes.local",
      role,
      projectMemberships: memberships,
    },
    expires: "2099-01-01",
  } as unknown as Session;
}

const SUPER_ADMIN_SESSION = makeSession("SUPER_ADMIN");
const USER_SESSION = makeSession("USER");

const PROJECT_A = "project-a";
const PROJECT_B = "project-b";

const SESSION_PROJECT_ADMIN_A = makeSession("USER", [
  { projectId: PROJECT_A, role: "PROJECT_ADMIN" },
]);

const SESSION_EMPLOYEE_A = makeSession("USER", [
  { projectId: PROJECT_A, role: "EMPLOYEE" },
]);

const SESSION_MULTI = makeSession("USER", [
  { projectId: PROJECT_A, role: "PROJECT_ADMIN" },
  { projectId: PROJECT_B, role: "EMPLOYEE" },
]);

// ─── Constantes exportadas ────────────────────────────────────────────────────

describe("GLOBAL_ROLES", () => {
  it("contiene SUPER_ADMIN y USER", () => {
    expect(GLOBAL_ROLES).toContain("SUPER_ADMIN");
    expect(GLOBAL_ROLES).toContain("USER");
    expect(GLOBAL_ROLES).toHaveLength(2);
  });
});

describe("PROJECT_ROLES", () => {
  it("contiene PROJECT_ADMIN y EMPLOYEE", () => {
    expect(PROJECT_ROLES).toContain("PROJECT_ADMIN");
    expect(PROJECT_ROLES).toContain("EMPLOYEE");
    expect(PROJECT_ROLES).toHaveLength(2);
  });
});

// ─── isSuperAdmin ─────────────────────────────────────────────────────────────

describe("isSuperAdmin", () => {
  it("devuelve true para sesión con rol SUPER_ADMIN", () => {
    expect(isSuperAdmin(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("devuelve false para sesión con rol USER", () => {
    expect(isSuperAdmin(USER_SESSION)).toBe(false);
  });

  it("devuelve false para sesión null", () => {
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("devuelve false para rol desconocido", () => {
    expect(isSuperAdmin(makeSession("ADMIN"))).toBe(false);
    expect(isSuperAdmin(makeSession("EMPLOYEE"))).toBe(false);
    expect(isSuperAdmin(makeSession(""))).toBe(false);
  });
});

// ─── isProjectAdmin ───────────────────────────────────────────────────────────

describe("isProjectAdmin", () => {
  it("SUPER_ADMIN es admin en cualquier proyecto sin necesidad de membresía", () => {
    expect(isProjectAdmin(SUPER_ADMIN_SESSION, PROJECT_A)).toBe(true);
    expect(isProjectAdmin(SUPER_ADMIN_SESSION, PROJECT_B)).toBe(true);
    expect(isProjectAdmin(SUPER_ADMIN_SESSION, "proyecto-inexistente")).toBe(true);
  });

  it("PROJECT_ADMIN en proyecto A es admin solo en A", () => {
    expect(isProjectAdmin(SESSION_PROJECT_ADMIN_A, PROJECT_A)).toBe(true);
    expect(isProjectAdmin(SESSION_PROJECT_ADMIN_A, PROJECT_B)).toBe(false);
  });

  it("EMPLOYEE en proyecto A NO es admin", () => {
    expect(isProjectAdmin(SESSION_EMPLOYEE_A, PROJECT_A)).toBe(false);
  });

  it("USER sin membresías no es admin en ningún proyecto", () => {
    expect(isProjectAdmin(USER_SESSION, PROJECT_A)).toBe(false);
  });

  it("devuelve false para sesión null", () => {
    expect(isProjectAdmin(null, PROJECT_A)).toBe(false);
  });

  it("sesión con membresías múltiples: admin en A, no en B", () => {
    expect(isProjectAdmin(SESSION_MULTI, PROJECT_A)).toBe(true);
    expect(isProjectAdmin(SESSION_MULTI, PROJECT_B)).toBe(false);
  });
});

// ─── canViewProject ───────────────────────────────────────────────────────────

describe("canViewProject", () => {
  it("SUPER_ADMIN puede ver cualquier proyecto", () => {
    expect(canViewProject(SUPER_ADMIN_SESSION, PROJECT_A)).toBe(true);
    expect(canViewProject(SUPER_ADMIN_SESSION, "cualquier-proyecto")).toBe(true);
  });

  it("miembro EMPLOYEE puede ver su proyecto", () => {
    expect(canViewProject(SESSION_EMPLOYEE_A, PROJECT_A)).toBe(true);
  });

  it("miembro EMPLOYEE no puede ver un proyecto ajeno", () => {
    expect(canViewProject(SESSION_EMPLOYEE_A, PROJECT_B)).toBe(false);
  });

  it("PROJECT_ADMIN puede ver su proyecto", () => {
    expect(canViewProject(SESSION_PROJECT_ADMIN_A, PROJECT_A)).toBe(true);
  });

  it("USER sin membresías no puede ver ningún proyecto", () => {
    expect(canViewProject(USER_SESSION, PROJECT_A)).toBe(false);
  });

  it("devuelve false para sesión null", () => {
    expect(canViewProject(null, PROJECT_A)).toBe(false);
  });

  it("sesión multi: puede ver A y B aunque tengan roles distintos", () => {
    expect(canViewProject(SESSION_MULTI, PROJECT_A)).toBe(true);
    expect(canViewProject(SESSION_MULTI, PROJECT_B)).toBe(true);
  });
});

// ─── hasAdminAccess ───────────────────────────────────────────────────────────

describe("hasAdminAccess", () => {
  it("SUPER_ADMIN tiene acceso de admin", () => {
    expect(hasAdminAccess(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("PROJECT_ADMIN en algún proyecto tiene acceso de admin", () => {
    expect(hasAdminAccess(SESSION_PROJECT_ADMIN_A)).toBe(true);
    expect(hasAdminAccess(SESSION_MULTI)).toBe(true);
  });

  it("EMPLOYEE puro no tiene acceso de admin", () => {
    expect(hasAdminAccess(SESSION_EMPLOYEE_A)).toBe(false);
  });

  it("USER sin membresías no tiene acceso de admin", () => {
    expect(hasAdminAccess(USER_SESSION)).toBe(false);
  });

  it("devuelve false para sesión null", () => {
    expect(hasAdminAccess(null)).toBe(false);
  });

  it("sesión con membresías vacías no tiene acceso de admin", () => {
    expect(hasAdminAccess(makeSession("USER", []))).toBe(false);
  });
});
