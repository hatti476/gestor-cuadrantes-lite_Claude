import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateUpdateEmployee } from "@/lib/employees/business-logic";

// ---------------------------------------------------------------------------
// PATCH /api/employees/[id] — edita nombre y/o rol (solo ADMIN)
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const validation = validateUpdateEmployee(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { name, role } = validation.data!;

  // Verificar que el empleado existe
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  // Actualizar en transacción: employee.name y/o user.role
  const [updatedEmployee] = await prisma.$transaction([
    ...(name ? [prisma.employee.update({ where: { id }, data: { name } })] : []),
    ...(role ? [prisma.user.update({ where: { id: employee.userId }, data: { role } })] : []),
  ]);

  return NextResponse.json(updatedEmployee ?? employee);
}
