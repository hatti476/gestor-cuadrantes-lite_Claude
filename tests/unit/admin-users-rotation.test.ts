import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// SPEC-010 H-09: POST /api/admin/users/[id]/rotation

const { mockPrisma, tx } = vi.hoisted(() => {
  // La lectura de la rotación se hace dentro de la transacción (peticiones concurrentes)
  const tx = { employee: { findMany: vi.fn(), update: vi.fn() } };
  return {
    tx,
    mockPrisma: {
      user: { findUnique: vi.fn() },
      $transaction: vi.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
    },
  };
});

vi.mock("next-auth", () => ({ getServerSession: vi.fn(), __esModule: true }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: { session: { strategy: "jwt" }, providers: [], callbacks: {} },
}));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/admin/users/[id]/rotation/route";

const sessionAs = (role: string) => ({ user: { id: "u-admin", email: "a@test", role } });
const call = (body: unknown, id = "u-2") =>
  POST(
    new NextRequest(`http://localhost/api/admin/users/${id}/rotation`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

describe("POST /api/admin/users/[id]/rotation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u-2", employee: { id: "e2", active: true } });
    tx.employee.findMany.mockResolvedValue([
      { id: "e1", rotationOrder: 1, active: true },
      { id: "e2", rotationOrder: 2, active: true },
      { id: "e3", rotationOrder: 3, active: true },
    ]);
  });

  it("sin sesión → 401", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    expect((await call({ direction: "up" })).status).toBe(401);
  });

  it.each(["TECNICO", "VIEWER"])("%s → 403 sin tocar la BD", async (role) => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs(role));
    expect((await call({ direction: "up" })).status).toBe(403);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("dirección inválida → 400", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    expect((await call({ direction: "left" })).status).toBe(400);
  });

  it("usuario sin empleado activo → 400", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u-9", employee: null });
    expect((await call({ direction: "up" }, "u-9")).status).toBe(400);
  });

  it("usuario inexistente → 404", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    mockPrisma.user.findUnique.mockResolvedValue(null);
    expect((await call({ direction: "up" }, "nope")).status).toBe(404);
  });

  it("subir e2 → e2 pasa a 1 y e1 a 2; se escriben todas las filas", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));

    const res = await call({ direction: "up" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: "e2", rotationOrder: 1 },
      { id: "e1", rotationOrder: 2 },
      { id: "e3", rotationOrder: 3 },
    ]);
    const updates = tx.employee.update.mock.calls.map((c) => c[0]);
    expect(updates).toEqual([
      { where: { id: "e2" }, data: { rotationOrder: 1 } },
      { where: { id: "e1" }, data: { rotationOrder: 2 } },
      { where: { id: "e3" }, data: { rotationOrder: 3 } },
    ]);
  });

  it("los inactivos se renumeran detrás de los activos (sin empates al reactivar)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    tx.employee.findMany.mockResolvedValue([
      { id: "e1", rotationOrder: 1, active: true },
      { id: "e2", rotationOrder: 2, active: true },
      { id: "x3", rotationOrder: 3, active: false },
      { id: "e4", rotationOrder: 4, active: true },
    ]);

    const body = await (await call({ direction: "up" })).json();

    expect(body).toEqual([
      { id: "e2", rotationOrder: 1 },
      { id: "e1", rotationOrder: 2 },
      { id: "e4", rotationOrder: 3 },
    ]);
    const written = Object.fromEntries(
      tx.employee.update.mock.calls.map((c) => [c[0].where.id, c[0].data.rotationOrder])
    );
    expect(written).toEqual({ e2: 1, e1: 2, e4: 3, x3: 4 });
  });

  it("renumera empates y huecos (1,1,5 → 1,2,3)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    tx.employee.findMany.mockResolvedValue([
      { id: "e1", rotationOrder: 1, active: true },
      { id: "e2", rotationOrder: 1, active: true },
      { id: "e3", rotationOrder: 5, active: true },
    ]);

    const body = await (await call({ direction: "down" })).json();

    expect(body.map((e: { rotationOrder: number }) => e.rotationOrder)).toEqual([1, 2, 3]);
  });
});
