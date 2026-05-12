import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateScheduleBody, getMonthRange } from "@/lib/schedules/business-logic";
import { canViewProject, isSuperAdmin, isProjectAdmin } from "@/lib/auth/permissions";

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

  // Filtro de empleados: si hay projectId, solo empleados de ese proyecto
  // Si no hay projectId: SUPER_ADMIN ve todos; USER ve su propio proyecto
  let employeeFilter: { projectId?: string | null } = {};
  if (projectId) {
    employeeFilter = { projectId };
  } else if (!isSuperAdmin(session)) {
    // USER sin projectId: ver solo empleados de sus proyectos
    const memberProjectIds = session.user.projectMemberships.map((m) => m.projectId);
    if (memberProjectIds.length > 0) {
      employeeFilter = { projectId: memberProjectIds[0] };
    }
  }

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      date: { gte: start, lt: end },
      ...(Object.keys(employeeFilter).length > 0
        ? { employee: employeeFilter }
        : {}),
    },
    include: {
      employee: {
        select: { id: true, name: true, rotationOrder: true, projectId: true },
      },
    },
    orderBy: [{ employee: { rotationOrder: "asc" } }, { date: "asc" }],
  });

  return NextResponse.json(assignments);
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
  if (!isSuperAdmin(session)) {
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId! },
      select: { projectId: true },
    });
    if (!emp?.projectId || !isProjectAdmin(session, emp.projectId)) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }
  }

  // Buscar turno previo para el log
  const previous = await prisma.shiftAssignment.findUnique({
    where: { employeeId_date: { employeeId: employeeId!, date: parsedDate! } },
    select: { shiftType: true },
  });

  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date: { employeeId: employeeId!, date: parsedDate! } },
    update: { shiftType: shiftType! },
    create: { employeeId: employeeId!, date: parsedDate!, shiftType: shiftType! },
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
