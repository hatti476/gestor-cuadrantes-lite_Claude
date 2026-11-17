import { describe, it, expect, vi, beforeEach } from "vitest";

// SPEC-011: el rol y el estado del usuario se releen de BD en cada petición

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { refreshTokenClaims } from "@/lib/auth/session-claims";

const token = { id: "u1", email: "x@test", role: "ADMIN" as const };

describe("refreshTokenClaims", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rol sin cambios → mismo rol, sin disabled", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN", employee: null });
    expect(await refreshTokenClaims(token)).toEqual({ ...token, role: "ADMIN", disabled: false });
    expect(mockPrisma.user.findUnique.mock.calls[0][0].where).toEqual({ id: "u1" });
  });

  it("rol cambiado en BD (ADMIN → VIEWER) → el token pasa a VIEWER", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: "VIEWER", employee: null });
    expect((await refreshTokenClaims(token)).role).toBe("VIEWER");
  });

  it("usuario borrado → disabled y sin rol", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const result = await refreshTokenClaims(token);
    expect(result.disabled).toBe(true);
    expect(result.role).toBeUndefined();
  });

  it("empleado desactivado → disabled y sin rol", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: "TECNICO", employee: { active: false } });
    const result = await refreshTokenClaims({ ...token, role: "TECNICO" });
    expect(result.disabled).toBe(true);
    expect(result.role).toBeUndefined();
  });

  it("ex-TECNICO ascendido a ADMIN (su Employee queda inactivo al cambiar de rol) → sigue activo", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN", employee: { active: false } });
    expect(await refreshTokenClaims(token)).toEqual({ ...token, role: "ADMIN", disabled: false });
  });

  it("token con rol pero sin id → se deniega", async () => {
    const result = await refreshTokenClaims({ role: "ADMIN" });
    expect(result.disabled).toBe(true);
    expect(result.role).toBeUndefined();
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rol desconocido en BD → disabled", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: "SUPER_ADMIN", employee: null });
    expect((await refreshTokenClaims(token)).disabled).toBe(true);
  });

  it("error de BD → se deniega (no conserva el rol antiguo)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.user.findUnique.mockRejectedValue(new Error("db down"));
    const result = await refreshTokenClaims(token);
    expect(result.disabled).toBe(true);
    expect(result.role).toBeUndefined();
  });

  it("token sin id (no autenticado) → se devuelve tal cual sin consultar", async () => {
    const anon = { email: "x@test" };
    expect(await refreshTokenClaims(anon)).toEqual(anon);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
