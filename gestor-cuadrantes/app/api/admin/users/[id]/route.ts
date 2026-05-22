import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/permissions";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/[id] — actualizar usuario, employee y membresías
// Solo SUPER_ADMIN
// Body: {
//   name?: string, email?: string, globalRole?: string,
//   shiftPreference?: string | null, active?: boolean,
//   projectAssignments?: { projectId: string; role: "PROJECT_ADMIN" | "EMPLOYEE" | null }[]
//   // role null = quitar del proyecto
// }
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      employee: true,
      projectMembers: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body requerido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Actualizar User
  const userUpdate: Record<string, unknown> = {};
  if (typeof b.email === "string" && b.email.includes("@")) {
    const existing = await prisma.user.findUnique({ where: { email: b.email.toLowerCase() } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 409 });
    }
    userUpdate.email = b.email.toLowerCase();
  }
  if (typeof b.globalRole === "string" && ["SUPER_ADMIN", "SUPER_VIEWER", "USER"].includes(b.globalRole)) {
    userUpdate.role = b.globalRole;
  }

  // Actualizar Employee (si existe)
  const empUpdate: Record<string, unknown> = {};
  if (typeof b.name === "string" && b.name.trim().length >= 2) empUpdate.name = b.name.trim();
  if (b.shiftPreference !== undefined) empUpdate.shiftPreference = b.shiftPreference ?? null;
  if (typeof b.active === "boolean") empUpdate.active = b.active;

  // Gestionar membresías de proyecto
  // projectAssignments: array de { projectId, role: "PROJECT_ADMIN"|"EMPLOYEE"|null }
  // role=null significa quitar la asignación
  const projectAssignments = Array.isArray(b.projectAssignments)
    ? (b.projectAssignments as { projectId: string; role: string | null }[])
    : null;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({ where: { id }, data: userUpdate });
    }
    if (user.employee && Object.keys(empUpdate).length > 0) {
      await tx.employee.update({ where: { id: user.employee.id }, data: empUpdate });
    }
    if (projectAssignments) {
      for (const assignment of projectAssignments) {
        if (!assignment.projectId) continue;
        if (assignment.role === null) {
          // Quitar del proyecto
          await tx.projectMember.deleteMany({
            where: { projectId: assignment.projectId, userId: id },
          });
          // Limpiar projectId en employee si coincide
          if (user.employee) {
            await tx.employee.updateMany({
              where: { userId: id, projectId: assignment.projectId },
              data: { projectId: null },
            });
          }
        } else if (["PROJECT_ADMIN", "EMPLOYEE"].includes(assignment.role)) {
          // Upsert membresía
          await tx.projectMember.upsert({
            where: { projectId_userId: { projectId: assignment.projectId, userId: id } },
            update: { role: assignment.role },
            create: { projectId: assignment.projectId, userId: id, role: assignment.role },
          });
          // Si el empleado no tiene projectId, asignar el primero con rol EMPLOYEE
          if (user.employee && assignment.role === "EMPLOYEE" && !user.employee.projectId) {
            await tx.employee.update({
              where: { id: user.employee.id },
              data: { projectId: assignment.projectId },
            });
          }
        }
      }
    }
  });

  // Devolver usuario actualizado
  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      employee: {
        select: {
          id: true,
          name: true,
          rotationOrder: true,
          shiftPreference: true,
          projectId: true,
          active: true,
          project: { select: { id: true, name: true } },
        },
      },
      projectMembers: {
        select: {
          projectId: true,
          role: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// PUT /api/admin/users/[id] — cambiar contraseña. Solo SUPER_ADMIN.
// Body: { newPassword: string }
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const newPassword: string = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return NextResponse.json(
      { error: "Contraseña inválida: mínimo 8 caracteres, 1 mayúscula y 1 número" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
