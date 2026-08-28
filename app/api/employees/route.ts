import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateCreateEmployee } from "@/lib/employees/business-logic";
import { isAdmin, canManageEmployees } from "@/lib/auth/permissions";

// ---------------------------------------------------------------------------
// GET /api/employees — lista empleados (single-project)
// RF-04: ADMIN ve todo; TECNICO y VIEWER no tienen acceso a lista de empleados
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede ver lista de empleados (canManageEmployees)
  if (!canManageEmployees(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede ver lista de empleados" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const employees = await prisma.employee.findMany({
    where: includeInactive ? {} : { active: true },
    select: {
      id: true,
      name: true,
      rotationOrder: true,
      shiftPreference: true,
      active: true,
      userId: true,
      user: { select: { id: true, email: true, role: true } },
    },
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

  // Solo ADMIN puede crear empleados
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede crear empleados" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateCreateEmployee(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { name, email, password, role } = validation.data!;

  // Validar que el rol sea TECNICO (solo TECNICO tiene Employee)
  if (role !== "TECNICO") {
    return NextResponse.json({ error: "Solo se pueden crear empleados con rol TECNICO" }, { status: 400 });
  }

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