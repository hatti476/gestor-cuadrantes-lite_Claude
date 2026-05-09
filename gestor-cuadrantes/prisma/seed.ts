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
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cuadrantes.local" },
    update: {},
    create: {
      email: "admin@cuadrantes.local",
      password: adminPassword,
      role: "ADMIN",
      employee: { create: { name: "Administrador", rotationOrder: 0 } },
    },
  });
  console.log("✓", admin.email);

  const techPassword = await bcrypt.hash("Tecnico1234!", 12);
  const employees: { id: string }[] = [];

  for (let i = 1; i <= 7; i++) {
    const email = `tecnico${i}@cuadrantes.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: techPassword,
        role: "EMPLOYEE",
        employee: { create: { name: `Técnico ${i}`, rotationOrder: i } },
      },
      include: { employee: true },
    });
    console.log("✓", user.email);
    if (user.employee) employees.push({ id: user.employee.id });
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
