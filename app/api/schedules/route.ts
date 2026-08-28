import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateScheduleBody, getMonthRange } from "@/lib/schedules/business-logic";
import { canViewSchedules, canEditSchedule, isAdmin } from "@/lib/auth/permissions";
import { computeMonthStatus } from "@/lib/schedules/types";

// ---------------------------------------------------------------------------
// GET /api/schedules?year=YYYY&month=M
// Devuelve los turnos del mes. Sin projectId (single-project).
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

  // Verificar si el cuadrante está publicado
  const scheduleRecord = await prisma.schedule.findFirst({
    where: { year, month },
    select: { published: true },
  });
  const published = scheduleRecord?.published ?? false;

  // RF-06: TECNICO y VIEWER solo ven si publicado; ADMIN ve siempre
  if (!canViewSchedules(session, published)) {
    return NextResponse.json({ assignments: [], monthStatus: "unpublished", published: false });
  }

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

  const monthStatus = computeMonthStatus(assignments);
  return NextResponse.json({ assignments, monthStatus, published });
}

// ---------------------------------------------------------------------------
// POST /api/schedules
// Body: { employeeId: string, date: string (ISO), shiftType: string }
// Solo ADMIN puede escribir (RF-04, RF-05).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede escribir
  if (!canEditSchedule(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede modificar turnos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateScheduleBody(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { employeeId, date: parsedDate, shiftType } = validation;

  // Buscar turno previo para el log
  const previous = await prisma.shiftAssignment.findFirst({
    where: { employeeId: employeeId!, date: parsedDate! },
    select: { shiftType: true, id: true },
  });

  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date: { employeeId: employeeId!, date: parsedDate! } },
    update: { shiftType: shiftType!, manual: true },
    create: { employeeId: employeeId!, date: parsedDate!, shiftType: shiftType!, manual: true },
  });

  // Registrar en el historial de cambios
  await prisma.shiftChangeLog.create({
    data: {
      employeeId: employeeId!,
      date: parsedDate!,
      oldShift: previous?.shiftType ?? null,
      newShift: shiftType!,
      changedBy: session.user.email ?? "unknown",
    },
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

  // Solo ADMIN puede eliminar
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede eliminar turnos" }, { status: 403 });
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