import { describe, it, expect } from "vitest";
import {
  isSuperAdmin,
  isSuperViewer,
  isProjectAdmin,
  canViewProject,
  canEditProject,
  hasAdminAccess,
  isAnyProjectAdmin,
  canViewEmployees,
  canViewHolidays,
  canManageHolidays,
  canManageProjectMembers,
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
const SUPER_VIEWER_SESSION = makeSession("SUPER_VIEWER");
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
  it("contiene SUPER_ADMIN, SUPER_VIEWER y USER", () => {
    expect(GLOBAL_ROLES).toContain("SUPER_ADMIN");
    expect(GLOBAL_ROLES).toContain("SUPER_VIEWER");
    expect(GLOBAL_ROLES).toContain("USER");
    expect(GLOBAL_ROLES).toHaveLength(3);
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

  it("devuelve false para SUPER_VIEWER", () => {
    expect(isSuperAdmin(SUPER_VIEWER_SESSION)).toBe(false);
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

// ─── isSuperViewer ────────────────────────────────────────────────────────────

describe("isSuperViewer", () => {
  it("devuelve true para sesión con rol SUPER_VIEWER", () => {
    expect(isSuperViewer(SUPER_VIEWER_SESSION)).toBe(true);
  });

  it("devuelve false para SUPER_ADMIN", () => {
    expect(isSuperViewer(SUPER_ADMIN_SESSION)).toBe(false);
  });

  it("devuelve false para USER", () => {
    expect(isSuperViewer(USER_SESSION)).toBe(false);
  });

  it("devuelve false para sesión null", () => {
    expect(isSuperViewer(null)).toBe(false);
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

  it("SUPER_VIEWER puede ver cualquier proyecto sin membresía", () => {
    expect(canViewProject(SUPER_VIEWER_SESSION, PROJECT_A)).toBe(true);
    expect(canViewProject(SUPER_VIEWER_SESSION, PROJECT_B)).toBe(true);
    expect(canViewProject(SUPER_VIEWER_SESSION, "proyecto-inexistente")).toBe(true);
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

// ─── canEditProject ───────────────────────────────────────────────────────────

describe("canEditProject", () => {
  it("SUPER_ADMIN puede editar cualquier proyecto", () => {
    expect(canEditProject(SUPER_ADMIN_SESSION, PROJECT_A)).toBe(true);
  });

  it("SUPER_VIEWER NUNCA puede editar (solo lectura)", () => {
    expect(canEditProject(SUPER_VIEWER_SESSION, PROJECT_A)).toBe(false);
    expect(canEditProject(SUPER_VIEWER_SESSION, PROJECT_B)).toBe(false);
    expect(canEditProject(SUPER_VIEWER_SESSION, "cualquier-proyecto")).toBe(false);
  });

  it("PROJECT_ADMIN puede editar su proyecto", () => {
    expect(canEditProject(SESSION_PROJECT_ADMIN_A, PROJECT_A)).toBe(true);
  });

  it("PROJECT_ADMIN no puede editar un proyecto ajeno", () => {
    expect(canEditProject(SESSION_PROJECT_ADMIN_A, PROJECT_B)).toBe(false);
  });

  it("EMPLOYEE no puede editar", () => {
    expect(canEditProject(SESSION_EMPLOYEE_A, PROJECT_A)).toBe(false);
  });

  it("devuelve false para sesión null", () => {
    expect(canEditProject(null, PROJECT_A)).toBe(false);
  });
});

// ─── hasAdminAccess ───────────────────────────────────────────────────────────

describe("hasAdminAccess", () => {
  it("SUPER_ADMIN tiene acceso de admin", () => {
    expect(hasAdminAccess(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("SUPER_VIEWER NO tiene acceso de admin (solo lectura)", () => {
    expect(hasAdminAccess(SUPER_VIEWER_SESSION)).toBe(false);
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

// ─── isAnyProjectAdmin ───────────────────────────────────────────────────────

describe("isAnyProjectAdmin", () => {
  it("true si es PROJECT_ADMIN en al menos un proyecto", () => {
    expect(isAnyProjectAdmin(SESSION_PROJECT_ADMIN_A)).toBe(true);
    expect(isAnyProjectAdmin(SESSION_MULTI)).toBe(true);
  });

  it("false si solo es EMPLOYEE en todos sus proyectos", () => {
    expect(isAnyProjectAdmin(SESSION_EMPLOYEE_A)).toBe(false);
  });

  it("false para SUPER_ADMIN (rol global, sin membresías de proyecto)", () => {
    expect(isAnyProjectAdmin(SUPER_ADMIN_SESSION)).toBe(false);
  });

  it("false para SUPER_VIEWER", () => {
    expect(isAnyProjectAdmin(SUPER_VIEWER_SESSION)).toBe(false);
  });

  it("false para sesión null", () => {
    expect(isAnyProjectAdmin(null)).toBe(false);
  });
});

// ─── canViewEmployees ────────────────────────────────────────────────────────

describe("canViewEmployees", () => {
  it("SUPER_ADMIN puede ver empleados", () => {
    expect(canViewEmployees(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("SUPER_VIEWER puede ver empleados", () => {
    expect(canViewEmployees(SUPER_VIEWER_SESSION)).toBe(true);
  });

  it("PROJECT_ADMIN puede ver empleados", () => {
    expect(canViewEmployees(SESSION_PROJECT_ADMIN_A)).toBe(true);
  });

  it("EMPLOYEE puro NO puede ver empleados", () => {
    expect(canViewEmployees(SESSION_EMPLOYEE_A)).toBe(false);
  });

  it("USER sin membresías NO puede ver empleados", () => {
    expect(canViewEmployees(USER_SESSION)).toBe(false);
  });

  it("false para sesión null", () => {
    expect(canViewEmployees(null)).toBe(false);
  });
});

// ─── canViewHolidays ─────────────────────────────────────────────────────────

describe("canViewHolidays", () => {
  it("SUPER_ADMIN puede ver festivos", () => {
    expect(canViewHolidays(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("SUPER_VIEWER puede ver festivos", () => {
    expect(canViewHolidays(SUPER_VIEWER_SESSION)).toBe(true);
  });

  it("PROJECT_ADMIN puede ver festivos", () => {
    expect(canViewHolidays(SESSION_PROJECT_ADMIN_A)).toBe(true);
  });

  it("EMPLOYEE puro NO puede ver festivos", () => {
    expect(canViewHolidays(SESSION_EMPLOYEE_A)).toBe(false);
  });

  it("false para sesión null", () => {
    expect(canViewHolidays(null)).toBe(false);
  });
});

// ─── canManageHolidays ───────────────────────────────────────────────────────

describe("canManageHolidays", () => {
  it("SUPER_ADMIN puede gestionar festivos", () => {
    expect(canManageHolidays(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("SUPER_VIEWER NO puede gestionar festivos", () => {
    expect(canManageHolidays(SUPER_VIEWER_SESSION)).toBe(false);
  });

  it("PROJECT_ADMIN NO puede gestionar festivos", () => {
    expect(canManageHolidays(SESSION_PROJECT_ADMIN_A)).toBe(false);
  });

  it("USER NO puede gestionar festivos", () => {
    expect(canManageHolidays(USER_SESSION)).toBe(false);
  });

  it("false para sesión null", () => {
    expect(canManageHolidays(null)).toBe(false);
  });
});

// ─── canManageProjectMembers ─────────────────────────────────────────────────

describe("canManageProjectMembers", () => {
  it("SUPER_ADMIN puede gestionar miembros de proyecto", () => {
    expect(canManageProjectMembers(SUPER_ADMIN_SESSION)).toBe(true);
  });

  it("SUPER_VIEWER NO puede gestionar miembros", () => {
    expect(canManageProjectMembers(SUPER_VIEWER_SESSION)).toBe(false);
  });

  it("PROJECT_ADMIN NO puede gestionar miembros (solo SUPER_ADMIN)", () => {
    expect(canManageProjectMembers(SESSION_PROJECT_ADMIN_A)).toBe(false);
  });

  it("USER NO puede gestionar miembros", () => {
    expect(canManageProjectMembers(USER_SESSION)).toBe(false);
  });

  it("false para sesión null", () => {
    expect(canManageProjectMembers(null)).toBe(false);
  });
});
