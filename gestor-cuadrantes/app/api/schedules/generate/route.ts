import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateMonthSchedule, isWeekend } from "@/lib/schedules/generate";
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

  // Obtener todos los empleados
  const employees = await prisma.employee.findMany({
    select: { id: true, rotationOrder: true },
    orderBy: { rotationOrder: "asc" },
  });

  // Obtener asignaciones ya existentes en el mes
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

  // Turnos base: M/T se comparan con el día actual; N con el día siguiente
  // (lógica centralizada en el filtro de existingSet a continuación)

  // Construir el set de celdas ya ocupadas.
  // EXCLUIR turnos que deben convertirse por festivo o fin de semana para que se regeneren.
  const existingSet = new Set<string>(
    existing
      .filter((a) => {
        const dateStr = a.date.toISOString().slice(0, 10);
        if (a.shiftType === "N") {
          // N: se regenera como NF si el día SIGUIENTE es festivo o fin de semana
          const nextDay = new Date(a.date.getTime() + 86_400_000);
          if (holidaySet.has(nextDay.toISOString().slice(0, 10)) || isWeekend(nextDay)) return false;
        } else if (a.shiftType === "M" || a.shiftType === "T") {
          // M/T: se regenera como MF/TF si el día actual es festivo o fin de semana
          if (holidaySet.has(dateStr) || isWeekend(a.date)) return false;
        }
        return true;
      })
      .map((a) => `${a.employeeId}|${a.date.toISOString().slice(0, 10)}`)
  );

  // Generar nuevas asignaciones
  const toCreate = generateMonthSchedule(employees, year, month, existingSet, holidaySet);

  // Insertar en BD — usar upsert individual para compatibilidad con SQLite
  for (const a of toCreate) {
    await prisma.shiftAssignment.upsert({
      where: {
        employeeId_date: { employeeId: a.employeeId, date: a.date },
      },
      create: { employeeId: a.employeeId, date: a.date, shiftType: a.shiftType },
      update: { shiftType: a.shiftType }, // actualizar si el turno cambia (ej. M→MF por festivo)
    });
  }

  return NextResponse.json({ created: toCreate.length });
}
