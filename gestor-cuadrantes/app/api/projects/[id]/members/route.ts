import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, isProjectAdmin, canViewProject } from "@/lib/auth/permissions";

const VALID_PROJECT_ROLES = ["PROJECT_ADMIN", "EMPLOYEE"] as const;

// ---------------------------------------------------------------------------
// GET /api/projects/[id]/members — lista miembros del proyecto
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

  if (!canViewProject(session, id)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
    orderBy: [{ role: "asc" }, { user: { email: "asc" } }],
  });

  return NextResponse.json(members);
}

// ---------------------------------------------------------------------------
// POST /api/projects/[id]/members — añadir miembro al proyecto
// Body: { userId: string, role: "PROJECT_ADMIN" | "EMPLOYEE" }
// SUPER_ADMIN o PROJECT_ADMIN del proyecto
// ---------------------------------------------------------------------------
export async function POST(
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
  if (!body || typeof body.userId !== "string" || !body.userId.trim()) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }
  const role = body.role ?? "EMPLOYEE";
  if (!VALID_PROJECT_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Rol inválido. Valores válidos: ${VALID_PROJECT_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Solo SUPER_ADMIN puede asignar PROJECT_ADMIN
  if (role === "PROJECT_ADMIN" && !isSuperAdmin(session)) {
    return NextResponse.json(
      { error: "Solo el SUPER_ADMIN puede asignar el rol PROJECT_ADMIN" },
      { status: 403 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: body.userId.trim() } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: id, userId: user.id } },
    update: { role },
    create: { projectId: id, userId: user.id, role },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}
