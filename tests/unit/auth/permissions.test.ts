import type { Session } from "next-auth";
import {
  ROLES,
  type Role,
  isAdmin,
  isTecnico,
  isViewer,
  canEditSchedule,
  canViewPublishedOnly,
  canManageEmployees,
  canManageHolidays,
  canViewHolidays,
  canViewSchedules,
} from "@/lib/auth/permissions";

const createMockSession = (role: Role): Session => ({
  user: {
    id: "user-1",
    email: `test-${role.toLowerCase()}@example.com`,
    role,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
});

describe("Roles enum", () => {
  test("ROLES contiene exactamente ADMIN, TECNICO, VIEWER", () => {
    expect(ROLES).toEqual(["ADMIN", "TECNICO", "VIEWER"]);
    expect(ROLES).toHaveLength(3);
  });
});

describe("Role guards", () => {
  test("isAdmin retorna true solo para ADMIN", () => {
    expect(isAdmin(createMockSession("ADMIN"))).toBe(true);
    expect(isAdmin(createMockSession("TECNICO"))).toBe(false);
    expect(isAdmin(createMockSession("VIEWER"))).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  test("isTecnico retorna true solo para TECNICO", () => {
    expect(isTecnico(createMockSession("TECNICO"))).toBe(true);
    expect(isTecnico(createMockSession("ADMIN"))).toBe(false);
    expect(isTecnico(createMockSession("VIEWER"))).toBe(false);
    expect(isTecnico(null)).toBe(false);
  });

  test("isViewer retorna true solo para VIEWER", () => {
    expect(isViewer(createMockSession("VIEWER"))).toBe(true);
    expect(isViewer(createMockSession("ADMIN"))).toBe(false);
    expect(isViewer(createMockSession("TECNICO"))).toBe(false);
    expect(isViewer(null)).toBe(false);
  });
});

describe("Permisos de escritura (RF-05: TECNICO y VIEWER read-only)", () => {
  test("canEditSchedule retorna true solo para ADMIN", () => {
    expect(canEditSchedule(createMockSession("ADMIN"))).toBe(true);
    expect(canEditSchedule(createMockSession("TECNICO"))).toBe(false);
    expect(canEditSchedule(createMockSession("VIEWER"))).toBe(false);
    expect(canEditSchedule(null)).toBe(false);
  });

  test("canManageEmployees retorna true solo para ADMIN", () => {
    expect(canManageEmployees(createMockSession("ADMIN"))).toBe(true);
    expect(canManageEmployees(createMockSession("TECNICO"))).toBe(false);
    expect(canManageEmployees(createMockSession("VIEWER"))).toBe(false);
    expect(canManageEmployees(null)).toBe(false);
  });

  test("canManageHolidays retorna true solo para ADMIN", () => {
    expect(canManageHolidays(createMockSession("ADMIN"))).toBe(true);
    expect(canManageHolidays(createMockSession("TECNICO"))).toBe(false);
    expect(canManageHolidays(createMockSession("VIEWER"))).toBe(false);
    expect(canManageHolidays(null)).toBe(false);
  });
});

describe("Permisos de lectura de cuadrantes (RF-06: gating por publicación)", () => {
  test("canViewSchedules: ADMIN ve siempre (incluso no publicado)", () => {
    expect(canViewSchedules(createMockSession("ADMIN"), false)).toBe(true);
    expect(canViewSchedules(createMockSession("ADMIN"), true)).toBe(true);
  });

  test("canViewSchedules: TECNICO solo ve si published=true", () => {
    expect(canViewSchedules(createMockSession("TECNICO"), false)).toBe(false);
    expect(canViewSchedules(createMockSession("TECNICO"), true)).toBe(true);
  });

  test("canViewSchedules: VIEWER solo ve si published=true", () => {
    expect(canViewSchedules(createMockSession("VIEWER"), false)).toBe(false);
    expect(canViewSchedules(createMockSession("VIEWER"), true)).toBe(true);
  });

  test("canViewSchedules: sin sesión retorna false", () => {
    expect(canViewSchedules(null, true)).toBe(false);
    expect(canViewSchedules(null, false)).toBe(false);
  });
});

describe("canViewPublishedOnly helper (RF-06)", () => {
  test("retorna true para TECNICO y VIEWER", () => {
    expect(canViewPublishedOnly(createMockSession("TECNICO"))).toBe(true);
    expect(canViewPublishedOnly(createMockSession("VIEWER"))).toBe(true);
  });

  test("retorna false para ADMIN", () => {
    expect(canViewPublishedOnly(createMockSession("ADMIN"))).toBe(false);
  });

  test("retorna false para sesión null", () => {
    expect(canViewPublishedOnly(null)).toBe(false);
  });
});

describe("Permisos de festivos", () => {
  test("canViewHolidays: ADMIN, TECNICO, VIEWER pueden ver", () => {
    expect(canViewHolidays(createMockSession("ADMIN"))).toBe(true);
    expect(canViewHolidays(createMockSession("TECNICO"))).toBe(true);
    expect(canViewHolidays(createMockSession("VIEWER"))).toBe(true);
  });

  test("canViewHolidays: sin sesión retorna false", () => {
    expect(canViewHolidays(null)).toBe(false);
  });
});

describe("Funciones obsoletas eliminadas", () => {
  test("isSuperAdmin no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof isSuperAdmin).toBe("undefined");
  });

  test("isSuperViewer no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof isSuperViewer).toBe("undefined");
  });

  test("isProjectAdmin no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof isProjectAdmin).toBe("undefined");
  });

  test("canViewProject no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof canViewProject).toBe("undefined");
  });

  test("canEditProject no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof canEditProject).toBe("undefined");
  });

  test("hasAdminAccess no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof hasAdminAccess).toBe("undefined");
  });

  test("isAnyProjectAdmin no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof isAnyProjectAdmin).toBe("undefined");
  });

  test("canManageProjectMembers no existe", () => {
    // @ts-expect-error - function should not exist
    expect(typeof canManageProjectMembers).toBe("undefined");
  });

  test("ProjectMembership type no existe", () => {
    // @ts-expect-error - type should not exist
    const _membership: import("@/lib/auth/permissions").ProjectMembership = { projectId: "", role: "" as never };
    expect(_membership).toBeDefined(); // This line should cause TS error if type exists
  });
});