import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// DELETE /api/holidays/[id] — solo ADMIN
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Festivo no encontrado" }, { status: 404 });

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
