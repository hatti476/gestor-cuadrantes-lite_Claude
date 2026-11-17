import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth/permissions";
import { isRotationDirection, moveInRotation } from "@/lib/employees/rotation";

// ---------------------------------------------------------------------------
// POST /api/admin/users/[id]/rotation  body: { direction: "up" | "down" }
// Mueve al empleado del usuario una posición en la rotación de noches y
// renumera: activos 1..n, inactivos n+1.. (corrige empates y huecos). Solo ADMIN.
// Desempate por id, igual que la generación (app/api/schedules/generate/route.ts).
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Prohibido: solo ADMIN" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { direction?: unknown } | null;
  if (!isRotationDirection(body?.direction)) {
    return NextResponse.json({ error: "direction inválido. Valores: up, down" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, employee: { select: { id: true, active: true } } },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (!user.employee?.active) {
    return NextResponse.json({ error: "Solo los empleados activos están en la rotación" }, { status: 400 });
  }

  const employeeId = user.employee.id;
  const direction = body.direction;

  // Lectura y escritura en la misma transacción, reescribiendo todas las filas, para
  // que dos peticiones simultáneas no dejen rotationOrder duplicados.
  const result = await prisma.$transaction(async (tx) => {
    const employees = await tx.employee.findMany({
      select: { id: true, rotationOrder: true, active: true },
      orderBy: [{ rotationOrder: "asc" }, { id: "asc" }],
    });
    const newActive = moveInRotation(
      employees.filter((e) => e.active).map((e) => e.id),
      employeeId,
      direction
    );
    if (!newActive) return null;

    // Inactivos detrás de los activos: al reactivar a alguien no hay empates
    const inactive = employees.filter((e) => !e.active).map((e) => e.id);
    const all = [...newActive, ...inactive];
    for (let i = 0; i < all.length; i++) {
      await tx.employee.update({ where: { id: all[i] }, data: { rotationOrder: i + 1 } });
    }
    return newActive.map((id, i) => ({ id, rotationOrder: i + 1 }));
  });

  if (!result) {
    return NextResponse.json({ error: "Empleado fuera de la rotación" }, { status: 400 });
  }

  return NextResponse.json(result);
}
