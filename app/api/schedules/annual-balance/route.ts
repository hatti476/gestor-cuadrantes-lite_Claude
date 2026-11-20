import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { countLaborableDays, countOccupiedDays } from "@/lib/schedules/business-logic";

// ---------------------------------------------------------------------------
// GET /api/schedules/annual-balance?year=YYYY
// SPEC-014: por empleado activo, suma de (jornadas ocupadas - días laborables)
// de cada mes con Schedule.published = true de ese año natural. Los meses sin
// publicar no cuentan (no tienen datos reales todavía).
//
// No se restringe por rol más allá de estar autenticado: solo agrega datos de
// meses ya publicados, que TECNICO/VIEWER ya pueden consultar vía GET
// /api/schedules para ese mismo mes.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const year = Number(req.nextUrl.searchParams.get("year"));
  if (!year) {
    return NextResponse.json({ error: "Parámetro year requerido" }, { status: 400 });
  }

  const publishedSchedules = await prisma.schedule.findMany({
    where: { year, published: true },
    select: { month: true },
  });

  if (publishedSchedules.length === 0) {
    return NextResponse.json({ year, balances: {} });
  }

  const [employees, holidays, assignments] = await Promise.all([
    prisma.employee.findMany({ where: { active: true }, select: { id: true } }),
    prisma.holiday.findMany({ where: { year }, select: { date: true } }),
    prisma.shiftAssignment.findMany({
      where: {
        date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
      select: { employeeId: true, date: true, shiftType: true },
    }),
  ]);

  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

  // Un solo pase sobre las asignaciones del año, agrupadas por mes y
  // empleado — en vez de volver a recorrer el array completo por cada mes
  // publicado (O(meses × asignaciones) en vez de O(asignaciones)).
  const shiftsByMonth = new Map<number, Map<string, string[]>>();
  for (const a of assignments) {
    const month = a.date.getUTCMonth() + 1;
    let byEmployee = shiftsByMonth.get(month);
    if (!byEmployee) {
      byEmployee = new Map();
      shiftsByMonth.set(month, byEmployee);
    }
    const list = byEmployee.get(a.employeeId) ?? [];
    list.push(a.shiftType);
    byEmployee.set(a.employeeId, list);
  }

  const balances: Record<string, number> = {};
  for (const employee of employees) {
    balances[employee.id] = 0;
  }

  for (const { month } of publishedSchedules) {
    const laborable = countLaborableDays(year, month, holidayDates);
    const shiftsByEmployee = shiftsByMonth.get(month);

    for (const employee of employees) {
      const occupied = countOccupiedDays(shiftsByEmployee?.get(employee.id) ?? []);
      balances[employee.id] += occupied - laborable;
    }
  }

  return NextResponse.json({ year, balances });
}
