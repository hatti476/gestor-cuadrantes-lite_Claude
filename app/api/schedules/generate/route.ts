import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateMonthSchedule, type GenerationWarning, type CoverageWarning, type PrevMonthTail } from "@/lib/schedules/generate";
import { getMonthRange } from "@/lib/schedules/business-logic";
import { canEditSchedule } from "@/lib/auth/permissions";

// POST /api/schedules/generate
// Body: { year: number, month: number }
// Solo ADMIN puede generar (RF-04).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede generar cuadrantes
  if (!canEditSchedule(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede generar cuadrantes" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { year, month } = body as { year?: number; month?: number };
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "year y month requeridos (month: 1-12)" },
      { status: 400 }
    );
  }

  // Obtener todos los empleados (single-project)
  const employees = await prisma.employee.findMany({
    where: { active: true },
    select: { id: true, rotationOrder: true, shiftPreference: true },
    orderBy: { rotationOrder: "asc" },
  });

  if (employees.length === 0) {
    return NextResponse.json({ error: "No hay empleados activos" }, { status: 400 });
  }

  // Obtener asignaciones ya existentes en el mes
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
  const ALWAYS_LOCKED = new Set(["V", "B"]);
  const existingSet = new Set<string>(
    existing
      .filter((a) => a.manual || ALWAYS_LOCKED.has(a.shiftType))
      .map((a) => `${a.employeeId}|${a.date.toISOString().slice(0, 10)}`)
  );
  const existingAssignments = new Map<string, string>(
    existing.map((a) => [`${a.employeeId}|${a.date.toISOString().slice(0, 10)}`, a.shiftType])
  );

  // Obtener los últimos 7 días del mes anterior para continuidad
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

  // Orden de rotación nocturna: usar rotationOrder de empleados (ya no hay Project.nightRotationOrder)
  const nightRotationIds = employees.map((e) => e.id);

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

  // Insertar en BD — una sola transacción
  await prisma.$transaction(
    toCreate.map((a) =>
      prisma.shiftAssignment.upsert({
        where: { employeeId_date: { employeeId: a.employeeId, date: a.date } },
        create: { employeeId: a.employeeId, date: a.date, shiftType: a.shiftType },
        update: { shiftType: a.shiftType },
      })
    )
  );

  // Actualizar/crear Schedule record
  await prisma.schedule.upsert({
    where: { year_month: { year, month } },
    create: { year, month, published: false },
    update: { generatedAt: new Date() },
  });

  return NextResponse.json({ created: toCreate.length, warnings, coverageWarnings });
}