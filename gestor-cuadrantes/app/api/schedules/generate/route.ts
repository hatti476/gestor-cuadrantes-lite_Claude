import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateMonthSchedule, PrevMonthTail } from "@/lib/schedules/generate";
import { getMonthRange } from "@/lib/schedules/business-logic";

// POST /api/schedules/generate
// Body: { year: number, month: number }
// Solo ADMIN. Genera turnos automáticos respetando los ya asignados.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
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

  // Obtener todos los empleados (con shiftPreference)
  const employees = await prisma.employee.findMany({
    select: { id: true, rotationOrder: true, shiftPreference: true },
    orderBy: { rotationOrder: "asc" },
  });

  // Obtener asignaciones ya existentes en el mes (para bloquear manuales/V/B)
  const { start, end } = getMonthRange(year, month);
  const existing = await prisma.shiftAssignment.findMany({
    where: { date: { gte: start, lt: end } },
    select: { employeeId: true, date: true, shiftType: true },
  });

  // Obtener festivos del mes
  const holidays = await prisma.holiday.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true },
  });
  const holidaySet = new Set<string>(
    holidays.map((h) => h.date.toISOString().slice(0, 10))
  );

  // Construir el set de celdas bloqueadas (manual / V / B — no regenerar)
  const LOCKED_TYPES = new Set(["V", "B", "J"]);
  const existingSet = new Set<string>(
    existing
      .filter((a) => LOCKED_TYPES.has(a.shiftType))
      .map((a) => `${a.employeeId}|${a.date.toISOString().slice(0, 10)}`)
  );

  // Obtener los últimos 7 días del mes anterior para continuidad
  const prevMonthEnd = new Date(start.getTime() - 1); // last ms of prev month
  const prevMonthStart = new Date(Date.UTC(prevMonthEnd.getUTCFullYear(), prevMonthEnd.getUTCMonth(), prevMonthEnd.getUTCDate() - 6));
  const prevTailRaw = await prisma.shiftAssignment.findMany({
    where: { date: { gte: prevMonthStart, lte: prevMonthEnd } },
    select: { employeeId: true, date: true, shiftType: true },
  });
  const prevMonthTail: PrevMonthTail[] = prevTailRaw.map((a) => ({
    employeeId: a.employeeId,
    date: a.date.toISOString().slice(0, 10),
    shiftType: a.shiftType,
  }));

  // Orden de rotación nocturna (de Project.nightRotationOrder si existe)
  let nightRotationIds: string[] | undefined;
  const projectWithRotation = await prisma.project.findFirst({
    where: { employees: { some: { id: { in: employees.map((e) => e.id) } } } },
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
  const toCreate = generateMonthSchedule(
    employees,
    year,
    month,
    existingSet,
    holidaySet,
    prevMonthTail,
    nightRotationIds
  );

  // Insertar en BD — una sola transacción para máximo rendimiento con SQLite
  await prisma.$transaction(
    toCreate.map((a) =>
      prisma.shiftAssignment.upsert({
        where: {
          employeeId_date: { employeeId: a.employeeId, date: a.date },
        },
        create: { employeeId: a.employeeId, date: a.date, shiftType: a.shiftType },
        update: { shiftType: a.shiftType },
      })
    )
  );

  return NextResponse.json({ created: toCreate.length });
}
