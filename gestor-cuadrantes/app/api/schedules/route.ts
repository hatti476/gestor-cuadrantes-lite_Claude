import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateScheduleBody, getMonthRange } from "@/lib/schedules/business-logic";
import { canViewProject, isSuperAdmin, isProjectAdmin } from "@/lib/auth/permissions";
import { computeMonthStatus } from "@/lib/schedules/types";

// ---------------------------------------------------------------------------
// GET /api/schedules?year=YYYY&month=M[&projectId=xxx]
// Devuelve los turnos del mes. Si projectId se pasa, filtra por proyecto.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-12
  const projectId = searchParams.get("projectId") || null;

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Parámetros year y month requeridos (month: 1-12)" },
      { status: 400 }
    );
  }

  // Verificar acceso al proyecto si se especifica
  if (projectId && !canViewProject(session, projectId)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { start, end } = getMonthRange(year, month);

  // Determinar el projectId efectivo para filtrar
  let effectiveProjectId: string | undefined | null = undefined;
  if (projectId) {
    effectiveProjectId = projectId;
  } else if (!isSuperAdmin(session)) {
    const memberProjectIds = session.user.projectMemberships.map((m) => m.projectId);
    effectiveProjectId = memberProjectIds[0] ?? null;
  }

  const canEditSchedule = effectiveProjectId
    ? isSuperAdmin(session) || isProjectAdmin(session, effectiveProjectId)
    : isSuperAdmin(session);

  const scheduleRecord = effectiveProjectId
    ? await prisma.schedule.findFirst({
        where: { year, month, projectId: effectiveProjectId },
        select: { published: true },
      })
    : null;
  const published = scheduleRecord?.published ?? false;

  if (!canEditSchedule && !published) {
    return NextResponse.json({ assignments: [], monthStatus: "unpublished", published: false });
  }

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      date: { gte: start, lt: end },
      ...(effectiveProjectId !== undefined ? { projectId: effectiveProjectId } : {}),
    },
    include: {
      employee: {
        select: { id: true, name: true, rotationOrder: true, projectId: true },
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
// SUPER_ADMIN o PROJECT_ADMIN del proyecto del empleado.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateScheduleBody(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { employeeId, date: parsedDate, shiftType } = validation;

  // Verificar que tiene permisos de edición para este empleado
  // SUPER_ADMIN puede editar cualquiera; PROJECT_ADMIN solo los de su proyecto
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId! },
    select: { projectId: true },
  });
  if (!isSuperAdmin(session)) {
    if (!emp?.projectId || !isProjectAdmin(session, emp.projectId)) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }
  }
  const assignmentProjectId = emp?.projectId ?? null;

  // Buscar turno previo para el log
  const previous = await prisma.shiftAssignment.findFirst({
    where: { employeeId: employeeId!, date: parsedDate!, projectId: assignmentProjectId },
    select: { shiftType: true, id: true },
  });

  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date_projectId: { employeeId: employeeId!, date: parsedDate!, projectId: assignmentProjectId! } },
    update: { shiftType: shiftType!, manual: true },
    create: { employeeId: employeeId!, date: parsedDate!, shiftType: shiftType!, manual: true, projectId: assignmentProjectId },
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

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Parámetro id requerido" }, { status: 400 });
  }

  // PROJECT_ADMIN puede eliminar turnos de su proyecto
  if (!isSuperAdmin(session)) {
    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id },
      include: { employee: { select: { projectId: true } } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
    }
    const projectId = assignment.employee.projectId;
    if (!projectId || !isProjectAdmin(session, projectId)) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }
  }

  try {
    await prisma.shiftAssignment.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
  }
}
