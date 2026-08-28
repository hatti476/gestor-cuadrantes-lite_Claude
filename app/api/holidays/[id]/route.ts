import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { canManageHolidays } from "@/lib/auth/permissions";

// DELETE /api/holidays/[id] — solo ADMIN
// L-02: al eliminar el festivo, revierte turnos MF→M, TF→T, NF(día anterior)→N
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!canManageHolidays(session)) {
    return NextResponse.json({ error: "Prohibido: solo ADMIN puede eliminar festivos" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Festivo no encontrado" }, { status: 404 });

  const holidayDate = existing.date; // UTC midnight of the holiday
  const prevDayDate = new Date(holidayDate.getTime() - 86_400_000); // day before

  // Recopilar turnos que deben revertirse
  const [mfAssignments, tfAssignments, nfAssignment] = await Promise.all([
    // MF → M en el día festivo
    prisma.shiftAssignment.findMany({
      where: { date: holidayDate, shiftType: "MF" },
      select: { id: true, employeeId: true },
    }),
    // TF → T en el día festivo
    prisma.shiftAssignment.findMany({
      where: { date: holidayDate, shiftType: "TF" },
      select: { id: true, employeeId: true },
    }),
    // NF → N en el día anterior
    prisma.shiftAssignment.findMany({
      where: { date: prevDayDate, shiftType: "NF" },
      select: { id: true, employeeId: true },
    }),
  ]);

  const changedBy = session.user.email ?? "unknown";
  const revertedCount = mfAssignments.length + tfAssignments.length + nfAssignment.length;

  // Ejecutar todo en una sola transacción
  await prisma.$transaction([
    // Eliminar el festivo
    prisma.holiday.delete({ where: { id } }),
    // Revertir MF → M
    ...mfAssignments.map((a) =>
      prisma.shiftAssignment.update({ where: { id: a.id }, data: { shiftType: "M" } })
    ),
    // Revertir TF → T
    ...tfAssignments.map((a) =>
      prisma.shiftAssignment.update({ where: { id: a.id }, data: { shiftType: "T" } })
    ),
    // Revertir NF → N (día anterior)
    ...nfAssignment.map((a) =>
      prisma.shiftAssignment.update({ where: { id: a.id }, data: { shiftType: "N" } })
    ),
    // Registrar cambios en el log
    ...mfAssignments.map((a) =>
      prisma.shiftChangeLog.create({
        data: { employeeId: a.employeeId, date: holidayDate, oldShift: "MF", newShift: "M", changedBy },
      })
    ),
    ...tfAssignments.map((a) =>
      prisma.shiftChangeLog.create({
        data: { employeeId: a.employeeId, date: holidayDate, oldShift: "TF", newShift: "T", changedBy },
      })
    ),
    ...nfAssignment.map((a) =>
      prisma.shiftChangeLog.create({
        data: { employeeId: a.employeeId, date: prevDayDate, oldShift: "NF", newShift: "N", changedBy },
      })
    ),
  ]);

  return NextResponse.json({ ok: true, reverted: revertedCount });
}