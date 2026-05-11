import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/permissions";

// ---------------------------------------------------------------------------
// GET /api/projects — lista proyectos accesibles por el usuario
// SUPER_ADMIN: todos los proyectos
// USER: solo los proyectos donde es miembro
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const projects = isSuperAdmin(session)
    ? await prisma.project.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { members: true, employees: true } } },
      })
    : await prisma.project.findMany({
        where: {
          members: { some: { userId: session.user.id } },
        },
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { members: true, employees: true } } },
      });

  return NextResponse.json(projects);
}

// ---------------------------------------------------------------------------
// POST /api/projects — crea un proyecto (solo SUPER_ADMIN)
// Body: { name: string, description?: string, region?: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || body.name.trim().length < 2) {
    return NextResponse.json(
      { error: "El nombre del proyecto es obligatorio (mínimo 2 caracteres)" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      region: body.region?.trim() || null,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
