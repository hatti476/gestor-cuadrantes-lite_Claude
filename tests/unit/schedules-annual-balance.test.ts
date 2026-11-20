import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// SPEC-014 AC-07/08/09/10: acumulado anual de (jornadas ocupadas - días
// laborables) por empleado, sumando solo los meses con Schedule.published = true.

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    schedule: { findMany: vi.fn() },
    employee: { findMany: vi.fn() },
    holiday: { findMany: vi.fn() },
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
import { GET } from "@/app/api/schedules/annual-balance/route";

const sessionAs = (role: string) => ({ user: { id: `user-${role}`, email: "x@test", role } });
const request = (qs = "year=2026") => new NextRequest(`http://localhost/api/schedules/annual-balance?${qs}`);

function monthAssignments(employeeId: string, year: number, month: number, occupiedCount: number, totalDays: number) {
  const list: { employeeId: string; date: Date; shiftType: string }[] = [];
  for (let day = 1; day <= totalDays; day++) {
    list.push({
      employeeId,
      date: new Date(Date.UTC(year, month - 1, day)),
      shiftType: day <= occupiedCount ? "M" : "D",
    });
  }
  return list;
}

describe("GET /api/schedules/annual-balance (SPEC-014)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sin sesión → 401", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const res = await GET(request());
    expect(res.status).toBe(401);
  });

  it("sin parámetro year → 400", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    const res = await GET(request(""));
    expect(res.status).toBe(400);
  });

  it("año sin ningún mes publicado → balances vacío, sin consultar turnos ni empleados (AC-10)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    mockPrisma.schedule.findMany.mockResolvedValue([]);

    const body = await (await GET(request())).json();

    expect(body).toEqual({ year: 2026, balances: {} });
    expect(mockPrisma.employee.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.shiftAssignment.findMany).not.toHaveBeenCalled();
  });

  it("suma solo los meses publicados (2 de 12) y usa una sola query de turnos para todo el año", async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionAs("ADMIN"));
    mockPrisma.schedule.findMany.mockResolvedValue([{ month: 5 }, { month: 8 }]);
    mockPrisma.employee.findMany.mockResolvedValue([{ id: "emp-1" }, { id: "emp-2" }]);
    mockPrisma.holiday.findMany.mockResolvedValue([
      { date: new Date("2026-05-01") }, // festivo nacional, viernes
      { date: new Date("2026-08-15") }, // festivo nacional, sábado (ya era finde)
    ]);
    mockPrisma.shiftAssignment.findMany.mockResolvedValue([
      ...monthAssignments("emp-1", 2026, 5, 18, 31), // laborable mayo = 20 → diff -2
      ...monthAssignments("emp-1", 2026, 8, 21, 31), // laborable agosto = 21 → diff 0
      // emp-2 no tiene ninguna asignación en ningún mes publicado
    ]);

    const body = await (await GET(request())).json();

    expect(body).toEqual({
      year: 2026,
      balances: { "emp-1": -2, "emp-2": -41 },
    });
    expect(mockPrisma.shiftAssignment.findMany).toHaveBeenCalledTimes(1);
  });

  it.each(["TECNICO", "VIEWER"])(
    "%s también puede consultar el acumulado (solo agrega meses ya publicados)",
    async (role) => {
      vi.mocked(getServerSession).mockResolvedValue(sessionAs(role));
      mockPrisma.schedule.findMany.mockResolvedValue([]);

      const res = await GET(request());

      expect(res.status).toBe(200);
    }
  );
});
