import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/schedules/business-logic";

// POST /api/schedules/snapshot
// Body: { projectId, month, year }
// Guarda el estado actual del cuadrante como snapshot (sobreescribe si ya existe).
// Solo SUPER_ADMIN o PROJECT_ADMIN.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isAdmin = session.user?.role === "SUPER_ADMIN";
  const memberships = (session.user as unknown as { projectMemberships?: { projectId: string; role: string }[] })
    .projectMemberships ?? [];

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { projectId, month, year } = body as { projectId?: string; month?: number; year?: number };
  if (!projectId || !month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "projectId, month y year requeridos" }, { status: 400 });
  }

  const isProjectAdmin = memberships.some(
    (m) => m.projectId === projectId && m.role === "PROJECT_ADMIN"
  );

  if (!isAdmin && !isProjectAdmin) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { start, end } = getMonthRange(year, month);
  const existing = await prisma.shiftAssignment.findMany({
    where: { projectId, date: { gte: start, lt: end } },
    select: { employeeId: true, date: true, shiftType: true },
  });

  const snapshotData = existing.map((a) => ({
    employeeId: a.employeeId,
    date: a.date.toISOString().slice(0, 10),
    shiftType: a.shiftType,
  }));

  const snapshot = await prisma.scheduleSnapshot.upsert({
    where: { projectId_month_year: { projectId, month, year } },
    update: { snapshot: JSON.stringify(snapshotData) },
    create: {
      projectId,
      month,
      year,
      snapshot: JSON.stringify(snapshotData),
    },
  });

  return NextResponse.json({ snapshotId: snapshot.id, createdAt: snapshot.createdAt });
}

// GET /api/schedules/snapshot?projectId=…&month=…&year=…
// Comprueba si existe un snapshot para el mes. Devuelve { exists: boolean, createdAt? }.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const month = parseInt(searchParams.get("month") ?? "0", 10);
  const year = parseInt(searchParams.get("year") ?? "0", 10);

  if (!projectId || !month || !year) {
    return NextResponse.json({ error: "projectId, month y year requeridos" }, { status: 400 });
  }

  const snapshot = await prisma.scheduleSnapshot.findUnique({
    where: { projectId_month_year: { projectId, month, year } },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    exists: snapshot !== null,
    snapshotId: snapshot?.id ?? null,
    createdAt: snapshot?.createdAt ?? null,
  });
}
