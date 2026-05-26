import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { canManageProjectMembers } from "@/lib/auth/permissions";

// ---------------------------------------------------------------------------
// DELETE /api/projects/[id]/members/[userId] — eliminar miembro del proyecto
// Solo SUPER_ADMIN
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, userId } = await params;

  if (!canManageProjectMembers(session)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId } },
  });

  if (!member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: id, userId } },
  });

  // If employee's projectId was this project, clear it
  await prisma.employee.updateMany({
    where: { userId, projectId: id },
    data: { projectId: null },
  });

  return NextResponse.json({ ok: true });
}
