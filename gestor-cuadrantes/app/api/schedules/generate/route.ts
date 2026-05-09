import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateMonthSchedule } from "@/lib/schedules/generate";
import { getMonthRange } from "@/lib/schedules/business-logic";

// POST /api/schedules/generate
// Body: { year: number, month: number }
// Solo ADMIN. Genera turnos automáticos respetando los ya asignados.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user?.role !== "ADMIN") {
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
    select: { employeeId: true, date: true },
  });

  // Construir el set de celdas ya ocupadas
  const existingSet = new Set<string>(
    existing.map((a) => `${a.employeeId}|${a.date.toISOString().slice(0, 10)}`)
  );

  // Generar nuevas asignaciones
  const toCreate = generateMonthSchedule(employees, year, month, existingSet);

  // Insertar en BD — usar upsert individual para compatibilidad con SQLite
  for (const a of toCreate) {
    await prisma.shiftAssignment.upsert({
      where: {
        employeeId_date: { employeeId: a.employeeId, date: a.date },
      },
      create: { employeeId: a.employeeId, date: a.date, shiftType: a.shiftType },
      update: {},
    });
  }

  return NextResponse.json({ created: toCreate.length });
}
