import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// SPEC-010 H-11: POST /api/admin/users no devuelve el hash de la contraseña

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    employee: { aggregate: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn(), __esModule: true }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: { session: { strategy: "jwt" }, providers: [], callbacks: {} },
}));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/admin/users/route";

const post = (body: unknown) =>
  POST(new NextRequest("http://localhost/api/admin/users", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/admin/users — respuesta sin password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a", email: "a@x", role: "ADMIN" } } as never);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.employee.aggregate.mockResolvedValue({ _max: { rotationOrder: 7 } });
    mockPrisma.user.create.mockImplementation(async (args: { select?: Record<string, unknown> }) => ({
      id: "u-new",
      email: "nuevo@x.com",
      role: "TECNICO",
      ...(args.select && "password" in args.select ? { password: "$2a$12$hash" } : {}),
      ...(args.select ? {} : { password: "$2a$12$hash" }),
    }));
  });

  it.each([
    ["TECNICO", { name: "Nuevo Técnico", email: "nuevo@x.com", password: "Nuevo1234!", globalRole: "TECNICO" }],
    ["VIEWER", { email: "nuevo@x.com", password: "Nuevo1234!", globalRole: "VIEWER" }],
  ])("alta %s → 201 sin campo password", async (_role, body) => {
    const res = await post(body);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).not.toHaveProperty("password");
    const args = mockPrisma.user.create.mock.calls[0][0];
    expect(args.select).toBeDefined();
    expect(args.select.password).toBeUndefined();
  });
});
