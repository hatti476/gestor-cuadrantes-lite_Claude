import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Patrones de turno para Mayo 2026 (31 días) — uno por empleado
// Índice 0 = día 1, índice 30 = día 31
const SHIFT_PATTERNS: string[][] = [
  // Técnico 1 — turno mañana con descansos
  "MMMDDTTTDDNNNDDMMMDDTTTDDNNNDDM".split(""),
  // Técnico 2 — turno tarde rotando
  "TTTDDNNNDDMMMDDTTTDDNNNDDMMMDDТ".replace("Т","T").split(""),
  // Técnico 3 — turno noche
  "NNNDDMMMDDTTTDDNNNDDMMMDDTTTDDN".split(""),
  // Técnico 4 — jornada normal
  "JJJJJDDJJJJJDDJJJJJDDJJJJJDDJJ".split(""),
  // Técnico 5 — mezcla con vacaciones
  "MMMDDTTTDDVVVVVDDMMMDDTTTDDNNNDD".slice(0,31).split(""),
  // Técnico 6 — mezcla con baja
  "BBBBBDDTTTDDNNNDDMMMDDTTTDDNNNDD".slice(0,31).split(""),
  // Técnico 7 — rotación completa
  "MTNJDVBMTNJDVBMTNJDVBMTNJDVBMTD".slice(0,31).split(""),
];

async function main() {
  // ─── Proyecto inicial ────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { id: "project-soporte-24h" },
    update: { name: "Equipo Soporte 24h" },
    create: {
      id: "project-soporte-24h",
      name: "Equipo Soporte 24h",
      description: "Equipo de soporte técnico con cobertura 24 horas",
    },
  });
  console.log("✓ Proyecto:", project.name);

  // ─── Admin global (SUPER_ADMIN) ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cuadrantes.local" },
    update: { password: adminPassword, role: "SUPER_ADMIN" },
    create: {
      email: "admin@cuadrantes.local",
      password: adminPassword,
      role: "SUPER_ADMIN",
      employee: { create: { name: "Administrador", rotationOrder: 0, projectId: project.id } },
    },
    include: { employee: true },
  });
  console.log("✓", admin.email);

  // Membresía SUPER_ADMIN en el proyecto
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: { role: "PROJECT_ADMIN" },
    create: { projectId: project.id, userId: admin.id, role: "PROJECT_ADMIN" },
  });

  // ─── Project Admin de ejemplo (pm@cuadrantes.local) ──────────────────────
  const pmPassword = await bcrypt.hash("PM1234!", 12);
  const pm = await prisma.user.upsert({
    where: { email: "pm@cuadrantes.local" },
    update: { password: pmPassword, role: "USER" },
    create: {
      email: "pm@cuadrantes.local",
      password: pmPassword,
      role: "USER",
    },
  });
  console.log("✓", pm.email);

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: pm.id } },
    update: { role: "PROJECT_ADMIN" },
    create: { projectId: project.id, userId: pm.id, role: "PROJECT_ADMIN" },
  });

  // ─── Técnicos (USER con EMPLOYEE en el proyecto) ─────────────────────────
  const techPassword = await bcrypt.hash("Tecnico1234!", 12);
  const employees: { id: string }[] = [];

  for (let i = 1; i <= 7; i++) {
    const email = `tecnico${i}@cuadrantes.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: techPassword, role: "USER" },
      create: {
        email,
        password: techPassword,
        role: "USER",
        employee: { create: { name: `Técnico ${i}`, rotationOrder: i, projectId: project.id } },
      },
      include: { employee: true },
    });
    console.log("✓", user.email);
    if (user.employee) employees.push({ id: user.employee.id });

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
      update: { role: "EMPLOYEE" },
      create: { projectId: project.id, userId: user.id, role: "EMPLOYEE" },
    });
  }

  // Sembrar turnos de Mayo 2026
  const year = 2026;
  const month = 5;
  const daysInMonth = new Date(year, month, 0).getDate(); // 31

  let assignmentsCreated = 0;
  for (let empIdx = 0; empIdx < employees.length; empIdx++) {
    const pattern = SHIFT_PATTERNS[empIdx] ?? [];
    const employeeId = employees[empIdx].id;

    for (let day = 1; day <= daysInMonth; day++) {
      const shiftType = pattern[day - 1];
      if (!shiftType) continue;

      const date = new Date(Date.UTC(year, month - 1, day));

      await prisma.shiftAssignment.upsert({
        where: { employeeId_date: { employeeId, date } },
        update: { shiftType },
        create: { employeeId, date, shiftType },
      });
      assignmentsCreated++;
    }
  }

  console.log(`✓ ${assignmentsCreated} turnos de Mayo 2026 sembrados`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
