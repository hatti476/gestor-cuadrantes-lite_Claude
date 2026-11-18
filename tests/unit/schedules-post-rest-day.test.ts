import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// SPEC-012 AC-12/13/14/15: festivos, sábados y domingos solo pueden marcarse
// como descanso (D) — V y B deben rechazarse también en el servidor, no solo
// en el cliente.

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    holiday: { findUnique: vi.fn() },
    shiftAssignment: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    shiftChangeLog: { create: vi.fn() },
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
import { POST } from "@/app/api/schedules/route";

const adminSession = { user: { id: "user-admin", email: "admin@test", role: "ADMIN" } };

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/schedules", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/schedules — regla festivo/fin de semana solo descanso (SPEC-012)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(adminSession);
    mockPrisma.holiday.findUnique.mockResolvedValue(null);
    mockPrisma.shiftAssignment.findFirst.mockResolvedValue(null);
    mockPrisma.shiftAssignment.upsert.mockResolvedValue({ id: "a1" });
    mockPrisma.shiftChangeLog.create.mockResolvedValue({});
  });

  it("rechaza V en sábado con 400", async () => {
    const res = await POST(postRequest({ employeeId: "emp-1", date: "2026-05-16", shiftType: "V" }));
    expect(res.status).toBe(400);
    expect(mockPrisma.shiftAssignment.upsert).not.toHaveBeenCalled();
  });

  it("rechaza B en domingo con 400", async () => {
    const res = await POST(postRequest({ employeeId: "emp-1", date: "2026-05-17", shiftType: "B" }));
    expect(res.status).toBe(400);
    expect(mockPrisma.shiftAssignment.upsert).not.toHaveBeenCalled();
  });

  it("rechaza V en festivo entre semana con 400", async () => {
    mockPrisma.holiday.findUnique.mockResolvedValue({ date: new Date("2026-05-01"), description: "Fiesta del Trabajo" });
    const res = await POST(postRequest({ employeeId: "emp-1", date: "2026-05-01", shiftType: "V" }));
    expect(res.status).toBe(400);
    expect(mockPrisma.shiftAssignment.upsert).not.toHaveBeenCalled();
  });

  it("permite D en sábado", async () => {
    const res = await POST(postRequest({ employeeId: "emp-1", date: "2026-05-16", shiftType: "D" }));
    expect(res.status).toBe(201);
    expect(mockPrisma.shiftAssignment.upsert).toHaveBeenCalled();
  });

  it("permite V en día de semana no festivo (comportamiento previo intacto)", async () => {
    const res = await POST(postRequest({ employeeId: "emp-1", date: "2026-05-15", shiftType: "V" }));
    expect(res.status).toBe(201);
    expect(mockPrisma.shiftAssignment.upsert).toHaveBeenCalled();
  });

  it("no afecta a turnos M/T/N en sábado/festivo (se siguen generando MF/TF/NF aparte)", async () => {
    const res = await POST(postRequest({ employeeId: "emp-1", date: "2026-05-16", shiftType: "M" }));
    expect(res.status).toBe(201);
  });
});
