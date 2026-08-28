import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/schedules/business-logic";
import { canEditSchedule } from "@/lib/auth/permissions";

// POST /api/schedules/snapshot/restore
// Body: { month, year }
// Restaura el cuadrante al snapshot guardado. Solo ADMIN.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede restaurar snapshots
  if (!canEditSchedule(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede restaurar snapshots" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { month, year } = body as { month?: number; year?: number };
  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "month y year requeridos" }, { status: 400 });
  }

  // Buscar snapshot
  const snapshot = await prisma.scheduleSnapshot.findUnique({
    where: { year_month: { year, month } },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "No existe snapshot para este mes" }, { status: 404 });
  }

  const snapshotData = JSON.parse(snapshot.snapshot) as {
    employeeId: string;
    date: string;
    shiftType: string;
  }[];

  const { start, end } = getMonthRange(year, month);

  // Eliminar asignaciones generadas (no manuales, no V/B) del mes
  await prisma.shiftAssignment.deleteMany({
    where: {
      date: { gte: start, lt: end },
      manual: false,
      shiftType: { notIn: ["V", "B"] },
    },
  });

  // Restaurar las asignaciones del snapshot
  let restored = 0;
  for (const item of snapshotData) {
    const dateObj = new Date(item.date + "T00:00:00.000Z");
    try {
      await prisma.shiftAssignment.upsert({
        where: { employeeId_date: { employeeId: item.employeeId, date: dateObj } },
        update: { shiftType: item.shiftType },
        create: {
          employeeId: item.employeeId,
          date: dateObj,
          shiftType: item.shiftType,
          manual: false,
        },
      });
      restored++;
    } catch {
      // Si ya existe con datos manuales, omitir
    }
  }

  return NextResponse.json({ restored });
}