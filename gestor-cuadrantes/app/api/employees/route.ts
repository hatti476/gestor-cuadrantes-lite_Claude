import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateCreateEmployee } from "@/lib/employees/business-logic";

// ---------------------------------------------------------------------------
// GET /api/employees — lista todos los empleados (cualquier usuario autenticado)
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const employees = await prisma.employee.findMany({
    include: { user: { select: { email: true, role: true } } },
    orderBy: { rotationOrder: "asc" },
  });

  return NextResponse.json(employees);
}

// ---------------------------------------------------------------------------
// POST /api/employees — crea un nuevo empleado (solo ADMIN)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateCreateEmployee(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { name, email, password, role } = validation.data!;

  // Comprobar que el email no está ya en uso
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Calcular rotationOrder = máximo actual + 1
  const maxOrder = await prisma.employee.aggregate({ _max: { rotationOrder: true } });
  const nextOrder = (maxOrder._max.rotationOrder ?? 0) + 1;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      employee: { create: { name, rotationOrder: nextOrder } },
    },
    include: { employee: true },
  });

  return NextResponse.json(user.employee, { status: 201 });
}
