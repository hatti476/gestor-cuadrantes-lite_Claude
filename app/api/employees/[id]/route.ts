import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateUpdateEmployee, isValidPassword, VALID_SHIFT_PREFERENCES, isValidShiftPreference } from "@/lib/employees/business-logic";
import { isAdmin, canManageEmployees } from "@/lib/auth/permissions";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// PATCH /api/employees/[id] — edita nombre, shiftPreference, activa/desactiva
// Solo ADMIN
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede editar empleados
  if (!canManageEmployees(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede editar empleados" }, { status: 403 });
  }

  const { id } = await params;

  // Verificar que el empleado existe
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body requerido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Validar name si viene
  if (b.name !== undefined) {
    const validation = validateUpdateEmployee({ name: b.name });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  // Validar shiftPreference si viene
  if (b.shiftPreference !== undefined) {
    if (!isValidShiftPreference(b.shiftPreference)) {
      return NextResponse.json(
        { error: `shiftPreference inválido. Valores: ${VALID_SHIFT_PREFERENCES.filter(v => v !== null).join(", ")}, o null` },
        { status: 400 }
      );
    }
  }

  // Actualizar employee y/o user en transacción
  const empData: Record<string, unknown> = {};
  const userData: Record<string, unknown> = {};

  if (typeof b.name === "string" && b.name.trim().length >= 2) empData.name = b.name.trim();
  if (b.shiftPreference !== undefined) empData.shiftPreference = b.shiftPreference ?? null;
  if (typeof b.active === "boolean") empData.active = b.active;
  // role no se puede cambiar via este endpoint (requiere lógica especial si se cambia TECNICO ↔ VIEWER)

  const ops = [
    ...(Object.keys(empData).length > 0
      ? [prisma.employee.update({ where: { id }, data: empData })]
      : []),
    ...(Object.keys(userData).length > 0
      ? [prisma.user.update({ where: { id: employee.userId }, data: userData })]
      : []),
  ];

  const results = await prisma.$transaction(ops);
  const updated = results[0] ?? employee;

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// PUT /api/employees/[id] — cambia contraseña (solo ADMIN)
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede cambiar contraseñas
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede cambiar contraseñas" }, { status: 403 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const newPassword: string = body?.newPassword ?? "";

  if (!isValidPassword(newPassword)) {
    return NextResponse.json(
      { error: "Contraseña inválida: mínimo 8 caracteres, 1 mayúscula y 1 número" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: employee.userId },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// DELETE /api/employees/[id] — soft-delete: marca active=false (ADMIN)
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede desactivar empleados
  if (!canManageEmployees(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede desactivar empleados" }, { status: 403 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  await prisma.employee.update({ where: { id }, data: { active: false } });

  return NextResponse.json({ ok: true });
}