import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateMonthSchedule, type GenerationWarning, type CoverageWarning, type PrevMonthTail } from "@/lib/schedules/generate";
import { getMonthRange } from "@/lib/schedules/business-logic";
import { isSuperAdmin, isProjectAdmin } from "@/lib/auth/permissions";

// POST /api/schedules/generate
// Body: { year: number, month: number, projectId?: string }
// SUPER_ADMIN o PROJECT_ADMIN del proyecto indicado.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { year, month, projectId } = body as { year?: number; month?: number; projectId?: string | null };
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "year y month requeridos (month: 1-12)" },
      { status: 400 }
    );
  }

  // Verificar permisos: SUPER_ADMIN puede generar cualquier proyecto;
  // PROJECT_ADMIN solo puede generar el suyo propio.
  if (!isSuperAdmin(session)) {
    if (!projectId || !isProjectAdmin(session, projectId)) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }
  }

  // Obtener empleados del proyecto activo (o todos si no hay projectId)
  // IMPORTANTE: filtrar por proyecto evita que datos residuales de otros proyectos
  // contaminen la generación (rotación nocturna, bloqueos, continuidad)
  const employeeWhere = projectId ? { projectId } : {};
  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    select: { id: true, rotationOrder: true, shiftPreference: true, projectId: true },
    orderBy: { rotationOrder: "asc" },
  });

  if (employees.length === 0) {
    return NextResponse.json({ error: "No hay empleados en el proyecto" }, { status: 400 });
  }

  // Obtener asignaciones ya existentes en el mes — solo de los empleados del proyecto
  const employeeIds = employees.map((e) => e.id);
  const { start, end } = getMonthRange(year, month);
  const existing = await prisma.shiftAssignment.findMany({
    where: { employeeId: { in: employeeIds }, date: { gte: start, lt: end } },
    select: { employeeId: true, date: true, shiftType: true, manual: true },
  });

  // Obtener festivos del mes
  const holidays = await prisma.holiday.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true },
  });
  const holidaySet = new Set<string>(
    holidays.map((h) => h.date.toISOString().slice(0, 10))
  );

  // Construir el set de celdas bloqueadas:
  //   - Cualquier asignación manual: no se sobreescribe al regenerar
  //   - V y B: siempre bloqueados (datos de RRHH explícitos)
  //   - J generado (manual=false) NO se bloquea: puede ser residual de otro proyecto
  const ALWAYS_LOCKED = new Set(["V", "B"]);
  const existingSet = new Set<string>(
    existing
      .filter((a) => a.manual || ALWAYS_LOCKED.has(a.shiftType))
      .map((a) => `${a.employeeId}|${a.date.toISOString().slice(0, 10)}`)
  );
  const existingAssignments = new Map<string, string>(
    existing.map((a) => [`${a.employeeId}|${a.date.toISOString().slice(0, 10)}`, a.shiftType])
  );

  // Obtener los últimos 7 días del mes anterior para continuidad — solo empleados del proyecto
  const prevMonthEnd = new Date(start.getTime() - 1); // last ms of prev month
  const prevMonthStart = new Date(Date.UTC(prevMonthEnd.getUTCFullYear(), prevMonthEnd.getUTCMonth(), prevMonthEnd.getUTCDate() - 6));
  const prevTailRaw = await prisma.shiftAssignment.findMany({
    where: { employeeId: { in: employeeIds }, date: { gte: prevMonthStart, lte: prevMonthEnd } },
    select: { employeeId: true, date: true, shiftType: true },
  });
  const prevMonthTail: PrevMonthTail[] = prevTailRaw.map((a) => ({
    employeeId: a.employeeId,
    date: a.date.toISOString().slice(0, 10),
    shiftType: a.shiftType,
  }));

  // Orden de rotación nocturna (de Project.nightRotationOrder si existe)
  let nightRotationIds: string[] | undefined;
  const projectWhere = projectId
    ? { id: projectId }
    : { employees: { some: { id: { in: employeeIds } } } };
  const projectWithRotation = await prisma.project.findFirst({
    where: projectWhere,
    select: { nightRotationOrder: true },
  });
  if (projectWithRotation?.nightRotationOrder) {
    try {
      nightRotationIds = JSON.parse(projectWithRotation.nightRotationOrder) as string[];
    } catch {
      // ignore parse error, fall back to rotationOrder
    }
  }

  // Generar nuevas asignaciones con el algoritmo Phase 2
  const warnings: GenerationWarning[] = [];
  const coverageWarnings: CoverageWarning[] = [];
  const toCreate = generateMonthSchedule(
    employees,
    year,
    month,
    existingSet,
    holidaySet,
    prevMonthTail,
    nightRotationIds,
    { existingAssignments, warnings, coverageWarnings }
  );

  // Insertar en BD — una sola transacción para máximo rendimiento con SQLite
  // projectId se incluye en cada asignación para que quede ligada al proyecto correcto
  // y no contamine a otros proyectos que reutilicen los mismos empleados
  await prisma.$transaction(
    toCreate.map((a) => {
      const empProjectId = employees.find((e) => e.id === a.employeeId)?.projectId ?? projectId ?? null;
      return prisma.shiftAssignment.upsert({
        where: {
          employeeId_date_projectId: { employeeId: a.employeeId, date: a.date, projectId: empProjectId! },
        },
        create: { employeeId: a.employeeId, date: a.date, shiftType: a.shiftType, projectId: empProjectId },
        update: { shiftType: a.shiftType },
      });
    })
  );

  return NextResponse.json({ created: toCreate.length, warnings, coverageWarnings });
}
