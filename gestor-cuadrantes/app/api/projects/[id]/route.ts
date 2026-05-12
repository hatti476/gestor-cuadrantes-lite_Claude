import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, isProjectAdmin } from "@/lib/auth/permissions";

// ---------------------------------------------------------------------------
// GET /api/projects/[id] — detalle de un proyecto
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Verificar acceso
  if (!isSuperAdmin(session) && !session.user.projectMemberships.some((m) => m.projectId === id)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true, employees: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
        orderBy: { role: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...project,
    nightRotationOrder: (project as unknown as { nightRotationOrder?: string | null }).nightRotationOrder ?? null,
  });
}

// ---------------------------------------------------------------------------
// PUT /api/projects/[id] — editar proyecto
// SUPER_ADMIN o PROJECT_ADMIN del proyecto
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (!isProjectAdmin(session, id)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body requerido" }, { status: 400 });
  }

  const data: {
    name?: string;
    description?: string | null;
    region?: string | null;
    nightRotationOrder?: string | null;
  } = {};
  if (typeof body.name === "string") {
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }
    data.name = body.name.trim();
  }
  if ("description" in body) data.description = body.description?.trim() || null;
  if ("region" in body) data.region = body.region?.trim() || null;
  if ("nightRotationOrder" in body) {
    if (body.nightRotationOrder === null || body.nightRotationOrder === "") {
      data.nightRotationOrder = null;
    } else if (typeof body.nightRotationOrder === "string") {
      try {
        const parsed = JSON.parse(body.nightRotationOrder);
        if (!Array.isArray(parsed) || parsed.some((x) => typeof x !== "string")) {
          return NextResponse.json({ error: "nightRotationOrder debe ser un array de IDs" }, { status: 400 });
        }
        data.nightRotationOrder = body.nightRotationOrder;
      } catch {
        return NextResponse.json({ error: "nightRotationOrder JSON inválido" }, { status: 400 });
      }
    }
  }

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json(project);
}

// ---------------------------------------------------------------------------
// DELETE /api/projects/[id] — eliminar proyecto (solo SUPER_ADMIN)
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { id } = await params;

  const exists = await prisma.project.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
