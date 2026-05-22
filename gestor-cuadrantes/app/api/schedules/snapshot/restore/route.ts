import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/schedules/business-logic";

// POST /api/schedules/snapshot/restore
// Body: { projectId, month, year }
// Restaura el cuadrante al snapshot guardado. Solo SUPER_ADMIN o PROJECT_ADMIN.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isAdmin = session.user?.role === "SUPER_ADMIN";
  const memberships = (session.user as unknown as { projectMemberships?: { projectId: string; role: string }[] })
    .projectMemberships ?? [];

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { projectId, month, year } = body as { projectId?: string; month?: number; year?: number };
  if (!projectId || !month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "projectId, month y year requeridos" }, { status: 400 });
  }

  const isProjectAdmin = memberships.some(
    (m) => m.projectId === projectId && m.role === "PROJECT_ADMIN"
  );

  if (!isAdmin && !isProjectAdmin) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  // Buscar snapshot
  const snapshot = await prisma.scheduleSnapshot.findUnique({
    where: { projectId_month_year: { projectId, month, year } },
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
      projectId,
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
        where: { employeeId_date_projectId: { employeeId: item.employeeId, date: dateObj, projectId } },
        update: { shiftType: item.shiftType },
        create: {
          employeeId: item.employeeId,
          date: dateObj,
          shiftType: item.shiftType,
          projectId,
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
