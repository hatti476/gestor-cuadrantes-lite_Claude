import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { canPublishSchedule } from "@/lib/auth/permissions";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    year?: number;
    month?: number;
    projectId?: string;
    published?: boolean;
  } | null;

  if (!body || !body.year || !body.month || !body.projectId || typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!canPublishSchedule(session, body.projectId)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const schedule = await prisma.schedule.findUnique({
    where: {
      year_month_projectId: {
        year: body.year,
        month: body.month,
        projectId: body.projectId,
      },
    },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Schedule no encontrado" }, { status: 404 });
  }

  if (schedule.published === body.published) {
    return NextResponse.json({
      published: schedule.published,
      publishedAt: schedule.publishedAt?.toISOString() ?? null,
      publishedBy: schedule.publishedBy ?? null,
    });
  }

  const updated = await prisma.schedule.update({
    where: { id: schedule.id },
    data: body.published
      ? { published: true, publishedAt: new Date(), publishedBy: session.user.id ?? null }
      : { published: false, publishedAt: null, publishedBy: null },
  });

  return NextResponse.json({
    published: updated.published,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    publishedBy: updated.publishedBy ?? null,
  });
}