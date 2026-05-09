import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateScheduleBody, getMonthRange } from "@/lib/schedules/business-logic";

// ---------------------------------------------------------------------------
// GET /api/schedules?year=YYYY&month=M
// Devuelve los turnos del mes para todos los empleados
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-12

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Parámetros year y month requeridos (month: 1-12)" },
      { status: 400 }
    );
  }

  const { start, end } = getMonthRange(year, month);

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: {
      employee: {
        select: { id: true, name: true, rotationOrder: true },
      },
    },
    orderBy: [{ employee: { rotationOrder: "asc" } }, { date: "asc" }],
  });

  return NextResponse.json(assignments);
}

// ---------------------------------------------------------------------------
// POST /api/schedules
// Body: { employeeId: string, date: string (ISO), shiftType: string }
// Solo ADMIN. Crea o actualiza (upsert) la asignación.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateScheduleBody(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { employeeId, date: parsedDate, shiftType } = validation;

  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date: { employeeId: employeeId!, date: parsedDate! } },
    update: { shiftType: shiftType! },
    create: { employeeId: employeeId!, date: parsedDate!, shiftType: shiftType! },
  });

  return NextResponse.json(assignment, { status: 201 });
}

// ---------------------------------------------------------------------------
// DELETE /api/schedules?id=xxx
// Solo ADMIN.
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Parámetro id requerido" }, { status: 400 });
  }

  try {
    await prisma.shiftAssignment.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
  }
}
