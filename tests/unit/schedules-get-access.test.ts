import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// SPEC-010 H-08: GET /api/schedules para TECNICO/VIEWER (fuente de empleados del fallback)

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    schedule: { findFirst: vi.fn() },
    shiftAssignment: { findMany: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
  __esModule: true,
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: { session: { strategy: "jwt" }, providers: [], callbacks: {} },
}));

import { getServerSession } from "next-auth";
import { GET } from "@/app/api/schedules/route";

const sessionAs = (role: string) => ({ user: { id: `user-${role}`, email: "x@test", role } });
const request = () => new NextRequest("http://localhost/api/schedules?year=2026&month=5");

describe("GET /api/schedules — acceso por rol (SPEC-010)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.shiftAssignment.findMany.mockResolvedValue([]);
  });

  it.each(["TECNICO", "VIEWER"])("%s con mes sin publicar → sin asignaciones y sin consultar turnos", async (role) => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs(role));
    mockPrisma.schedule.findFirst.mockResolvedValue({ published: false });

    const body = await (await GET(request())).json();

    expect(body).toEqual({ assignments: [], monthStatus: "unpublished", published: false });
    expect(mockPrisma.shiftAssignment.findMany).not.toHaveBeenCalled();
  });

  it("mes publicado → los empleados incluyen userId para resaltar la fila propia (H-08)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("TECNICO"));
    mockPrisma.schedule.findFirst.mockResolvedValue({ published: true });

    await GET(request());

    const args = mockPrisma.shiftAssignment.findMany.mock.calls[0][0];
    expect(args.include.employee.select).toEqual({
      id: true,
      name: true,
      rotationOrder: true,
      userId: true,
    });
  });
});
