import { describe, it, expect, vi, beforeEach } from "vitest";

// SPEC-010 H-12: un empleado desactivado no puede iniciar sesión

const { mockPrisma, compare } = vi.hoisted(() => ({
  mockPrisma: { user: { findUnique: vi.fn() } },
  compare: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("bcryptjs", () => ({ default: { compare }, compare }));

import { authorizeCredentials } from "@/lib/auth/authorize";

const CREDS = { email: "tecnico1@cuadrantes.local", password: "Tecnico1234!" };

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    compare.mockResolvedValue(true);
  });

  it("credenciales vacías → null sin consultar la BD", async () => {
    expect(await authorizeCredentials({ email: "", password: "" })).toBeNull();
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("usuario inexistente o contraseña incorrecta → null", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    expect(await authorizeCredentials(CREDS)).toBeNull();

    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: CREDS.email, password: "h", role: "TECNICO", employee: { active: true } });
    compare.mockResolvedValue(false);
    expect(await authorizeCredentials(CREDS)).toBeNull();
  });

  it("TECNICO activo → id, email y rol", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: CREDS.email, password: "h", role: "TECNICO", employee: { active: true } });
    expect(await authorizeCredentials(CREDS)).toEqual({ id: "u1", email: CREDS.email, role: "TECNICO" });
  });

  it("TECNICO desactivado → null aunque la contraseña sea correcta", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: CREDS.email, password: "h", role: "TECNICO", employee: { active: false } });
    expect(await authorizeCredentials(CREDS)).toBeNull();
  });

  it("ADMIN/VIEWER sin registro de empleado → acceso normal", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u2", email: "viewer@x", password: "h", role: "VIEWER", employee: null });
    expect(await authorizeCredentials({ email: "viewer@x", password: "p" })).toEqual({ id: "u2", email: "viewer@x", role: "VIEWER" });
  });

  it("el email se busca en minúsculas (el alta lo guarda así)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await authorizeCredentials({ email: "Tecnico1@Cuadrantes.Local", password: "x" });
    expect(mockPrisma.user.findUnique.mock.calls[0][0].where).toEqual({ email: "tecnico1@cuadrantes.local" });
  });
});
