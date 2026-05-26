import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, isSuperViewer, isProjectAdmin } from "@/lib/auth/permissions";

// GET /api/employees/[id]/history?page=1&limit=20&month=YYYY-MM
// Acceso: SUPER_ADMIN, SUPER_VIEWER, PROJECT_ADMIN (propio proyecto del empleado)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  // Verificar permisos después de cargar el empleado para poder comprobar su proyecto
  const allowed =
    isSuperAdmin(session) ||
    isSuperViewer(session) ||
    (employee.projectId !== null && isProjectAdmin(session, employee.projectId));
  if (!allowed) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  // Query params
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const monthParam = req.nextUrl.searchParams.get("month"); // "YYYY-MM" o null

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? "20", 10) || 20));

  // Filtro de fecha por mes
  const dateFilter: { gte?: Date; lt?: Date } = {};
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    dateFilter.gte = new Date(Date.UTC(y, m - 1, 1));
    dateFilter.lt = new Date(Date.UTC(y, m, 1));
  }

  const where = {
    employeeId: id,
    ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
  };

  // Conteo total y registros paginados en paralelo
  const [total, logs] = await Promise.all([
    prisma.shiftChangeLog.count({ where }),
    prisma.shiftChangeLog.findMany({
      where,
      orderBy: { changedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Meses disponibles con al menos un registro (para el selector de filtro)
  const allLogs = await prisma.shiftChangeLog.findMany({
    where: { employeeId: id },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const monthSet = new Set<string>();
  for (const log of allLogs) {
    const d = new Date(log.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthSet.add(key);
  }
  const availableMonths = Array.from(monthSet).sort().reverse();

  return NextResponse.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    availableMonths,
  });
}
