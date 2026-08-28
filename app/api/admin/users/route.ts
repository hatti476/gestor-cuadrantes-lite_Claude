import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth/permissions";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// GET /api/admin/users — lista todos los usuarios con sus empleados
// Solo ADMIN
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Prohibido: solo ADMIN" }, { status: 403 });

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
          active: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}

// ---------------------------------------------------------------------------
// POST /api/admin/users — crear usuario
// Solo ADMIN
// Body: {
//   name: string, email: string, password: string,
//   globalRole: "ADMIN" | "TECNICO" | "VIEWER",
//   shiftPreference?: string | null  (solo para TECNICO)
// }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Prohibido: solo ADMIN" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body requerido" }, { status: 400 });

  const { name, email, password, globalRole, shiftPreference } =
    body as {
      name?: string;
      email?: string;
      password?: string;
      globalRole?: string;
      shiftPreference?: string | null;
    };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const VALID_ROLES = ["ADMIN", "TECNICO", "VIEWER"];
  if (!globalRole || !VALID_ROLES.includes(globalRole)) {
    return NextResponse.json({ error: "Rol inválido. Valores: ADMIN, TECNICO, VIEWER" }, { status: 400 });
  }

  // Nombre es obligatorio para TECNICO (tiene Employee)
  if (globalRole === "TECNICO" && (!name || typeof name !== "string" || name.trim().length < 2)) {
    return NextResponse.json({ error: "Nombre requerido para TECNICO (mínimo 2 caracteres)" }, { status: 400 });
  }
  const safeName = typeof name === "string" ? name.trim() : "";

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Contraseña inválida: mínimo 8 caracteres" }, { status: 400 });
  }

  // Validar shiftPreference solo para TECNICO
  if (globalRole === "TECNICO" && shiftPreference !== undefined && shiftPreference !== null) {
    if (!["M", "T"].includes(shiftPreference)) {
      return NextResponse.json({ error: "shiftPreference inválido: solo M, T o null" }, { status: 400 });
    }
  }

  // Comprobar email único
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Para TECNICO, crear también Employee record
  if (globalRole === "TECNICO") {
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
      },
      include: { employee: true },
    });
    return NextResponse.json(user, { status: 201 });
  } else {
    // ADMIN o VIEWER: solo User record, sin Employee
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