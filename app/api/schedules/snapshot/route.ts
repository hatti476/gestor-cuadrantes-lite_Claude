import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/schedules/business-logic";
import { canEditSchedule } from "@/lib/auth/permissions";

// POST /api/schedules/snapshot
// Body: { month, year }
// Guarda el estado actual del cuadrante como snapshot (sobreescribe si ya existe).
// Solo ADMIN.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede crear snapshots
  if (!canEditSchedule(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede crear snapshots" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { month, year } = body as { month?: number; year?: number };
  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "month y year requeridos" }, { status: 400 });
  }

  const { start, end } = getMonthRange(year, month);
  const existing = await prisma.shiftAssignment.findMany({
    where: { date: { gte: start, lt: end } },
    select: { employeeId: true, date: true, shiftType: true },
  });

  const snapshotData = existing.map((a) => ({
    employeeId: a.employeeId,
    date: a.date.toISOString().slice(0, 10),
    shiftType: a.shiftType,
  }));

  const snapshot = await prisma.scheduleSnapshot.upsert({
    where: { year_month: { year, month } },
    update: { snapshot: JSON.stringify(snapshotData) },
    create: {
      month,
      year,
      snapshot: JSON.stringify(snapshotData),
    },
  });

  return NextResponse.json({ snapshotId: snapshot.id, createdAt: snapshot.createdAt });
}

// GET /api/schedules/snapshot?month=…&year=…
// Comprueba si existe un snapshot para el mes. Devuelve { exists: boolean, createdAt? }.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? "0", 10);
  const year = parseInt(searchParams.get("year") ?? "0", 10);

  if (!month || !year) {
    return NextResponse.json({ error: "month y year requeridos" }, { status: 400 });
  }

  const snapshot = await prisma.scheduleSnapshot.findUnique({
    where: { year_month: { year, month } },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    exists: snapshot !== null,
    snapshotId: snapshot?.id ?? null,
    createdAt: snapshot?.createdAt ?? null,
  });
}