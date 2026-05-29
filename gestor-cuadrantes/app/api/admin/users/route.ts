import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/permissions";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// GET /api/admin/users — lista todos los usuarios con sus empleados y miembros
// Solo SUPER_ADMIN
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
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

  return NextResponse.json(users);
}

// ---------------------------------------------------------------------------
// POST /api/admin/users — crear usuario (con o sin Employee record)
// Solo SUPER_ADMIN
// Body: {
//   name: string, email: string, password: string,
//   globalRole: "SUPER_ADMIN" | "SUPER_VIEWER" | "USER",
//   shiftPreference?: string | null,
//   projectAssignments?: { projectId: string; role: "PROJECT_ADMIN" | "EMPLOYEE" }[]
// }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body requerido" }, { status: 400 });

  const { name, email, password, globalRole, shiftPreference, projectAssignments } =
    body as {
      name?: string;
      email?: string;
      password?: string;
      globalRole?: string;
      shiftPreference?: string | null;
      projectAssignments?: { projectId: string; role: string }[];
    };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (!globalRole || !["SUPER_ADMIN", "SUPER_VIEWER", "USER"].includes(globalRole)) {
    return NextResponse.json({ error: "Rol global inválido" }, { status: 400 });
  }
  // Nombre solo es obligatorio para USER (tiene registro Employee)
  if (globalRole === "USER" && (!name || typeof name !== "string" || name.trim().length < 2)) {
    return NextResponse.json({ error: "Nombre requerido (mínimo 2 caracteres)" }, { status: 400 });
  }
  const safeName = typeof name === "string" ? name.trim() : "";
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Contraseña inválida: mínimo 8 caracteres" }, { status: 400 });
  }

  const VALID_GLOBAL_ROLES = ["SUPER_ADMIN", "SUPER_VIEWER", "USER"];
  if (!globalRole || !VALID_GLOBAL_ROLES.includes(globalRole)) {
    return NextResponse.json({ error: "Rol global inválido" }, { status: 400 });
  }

  // Comprobar email único
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Para usuarios con rol USER, crear también Employee record
  if (globalRole === "USER") {
    const maxOrder = await prisma.employee.aggregate({ _max: { rotationOrder: true } });
    const nextOrder = (maxOrder._max.rotationOrder ?? 0) + 1;

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: globalRole,
        employee: {
          create: {
            name: safeName,
            rotationOrder: nextOrder,
            shiftPreference: shiftPreference ?? null,
          },
        },
        // Crear membresías de proyecto
        projectMembers: projectAssignments && projectAssignments.length > 0
          ? {
              create: projectAssignments
                .filter((a) => a.projectId && ["PROJECT_ADMIN", "EMPLOYEE"].includes(a.role))
                .map((a) => ({ projectId: a.projectId, role: a.role })),
            }
          : undefined,
      },
      include: {
        employee: true,
        projectMembers: { include: { project: { select: { id: true, name: true } } } },
      },
    });
    return NextResponse.json(user, { status: 201 });
  } else {
    // SUPER_ADMIN o SUPER_VIEWER: solo User record, sin Employee ni membresías
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: globalRole,
      },
    });
    return NextResponse.json(user, { status: 201 });
  }
}
