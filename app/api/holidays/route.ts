import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { canManageHolidays, canViewHolidays } from "@/lib/auth/permissions";

// GET /api/holidays?year=2026
// ADMIN, TECNICO, VIEWER pueden ver festivos (RF-04: lectura)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!canViewHolidays(session)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const holidays = await prisma.holiday.findMany({
    where: { year },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(holidays);
}

// POST /api/holidays — solo ADMIN
// Body: { date: "YYYY-MM-DD", description: string }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!canManageHolidays(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede crear festivos" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { date, description } = body as { date?: string; description?: string };
  if (!date || !description?.trim()) {
    return NextResponse.json({ error: "date y description son requeridos" }, { status: 400 });
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  let holiday;
  try {
    holiday = await prisma.holiday.create({
      data: {
        date: parsed,
        description: description.trim(),
        year: parsed.getUTCFullYear(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Ya existe un festivo en esa fecha" }, { status: 409 });
  }

  // Actualizar automáticamente las asignaciones existentes afectadas:
  // M→MF y T→TF en el día festivo
  // N→NF en el día ANTERIOR (turno de noche que termina en el festivo)
  const prevDay = new Date(parsed.getTime() - 86_400_000);
  await prisma.$transaction([
    prisma.shiftAssignment.updateMany({
      where: { date: parsed, shiftType: "M" },
      data: { shiftType: "MF" },
    }),
    prisma.shiftAssignment.updateMany({
      where: { date: parsed, shiftType: "T" },
      data: { shiftType: "TF" },
    }),
    prisma.shiftAssignment.updateMany({
      where: { date: prevDay, shiftType: "N" },
      data: { shiftType: "NF" },
    }),
  ]);

  return NextResponse.json(holiday, { status: 201 });
}