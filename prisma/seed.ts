import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

// Patrones de turno para Mayo 2026 (31 días) — uno por empleado
// Índice 0 = día 1, índice 30 = día 31
const SHIFT_PATTERNS: string[][] = [
  // Técnico 1 — turno mañana con descansos
  "MMMDDTTTDDNNNDDMMMDDTTTDDNNNDDM".split(""),
  // Técnico 2 — turno tarde rotando
  "TTTDDNNNDDMMMDDTTTDDNNNDDMMMDDТ".replace("Т", "T").split(""),
  // Técnico 3 — turno noche
  "NNNDDMMMDDTTTDDNNNDDMMMDDTTTDDN".split(""),
  // Técnico 4 — jornada normal
  "JJJJJDDJJJJJDDJJJJJDDJJJJJDDJJ".split(""),
  // Técnico 5 — mezcla con vacaciones
  "MMMDDTTTDDVVVVVDDMMMDDTTTDDNNNDD".slice(0, 31).split(""),
  // Técnico 6 — mezcla con baja
  "BBBBBDDTTTDDNNNDDMMMDDTTTDDNNNDD".slice(0, 31).split(""),
  // Técnico 7 — rotación completa
  "MTNJDVBMTNJDVBMTNJDVBMTNJDVBMTD".slice(0, 31).split(""),
];

async function main() {
  // ─── Admin global (ADMIN) ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cuadrantes.local" },
    update: { password: adminPassword, role: "ADMIN" },
    create: {
      email: "admin@cuadrantes.local",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✓ ADMIN:", admin.email);

  // ─── Técnico ejemplo (TECNICO con Employee) ────────────────────────────────
  const techPassword = await bcrypt.hash("Tecnico1234!", 12);
  const techUser = await prisma.user.upsert({
    where: { email: "tecnico@cuadrantes.local" },
    update: { password: techPassword, role: "TECNICO" },
    create: {
      email: "tecnico@cuadrantes.local",
      password: techPassword,
      role: "TECNICO",
      employee: {
        create: { name: "Técnico Ejemplo", rotationOrder: 1, shiftPreference: "M", active: true },
      },
    },
    include: { employee: true },
  });
  console.log("✓ TECNICO:", techUser.email, "| Employee:", techUser.employee?.name);

  // ─── 7 Técnicos adicionales (TECNICO con Employee) ─────────────────────────
  const employees: { id: string }[] = [];

  for (let i = 1; i <= 7; i++) {
    const email = `tecnico${i}@cuadrantes.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: techPassword, role: "TECNICO" },
      create: {
        email,
        password: techPassword,
        role: "TECNICO",
        employee: { create: { name: `Técnico ${i}`, rotationOrder: i, shiftPreference: i % 2 === 0 ? "T" : "M", active: true } },
      },
      include: { employee: true },
    });
    console.log("✓ TECNICO:", user.email, "| Employee:", user.employee?.name);
    if (user.employee) employees.push({ id: user.employee.id });
  }

  // ─── Viewer ejemplo (VIEWER sin Employee) ──────────────────────────────────
  const viewerPassword = await bcrypt.hash("Viewer1234!", 12);
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@cuadrantes.local" },
    update: { password: viewerPassword, role: "VIEWER" },
    create: {
      email: "viewer@cuadrantes.local",
      password: viewerPassword,
      role: "VIEWER",
    },
  });
  console.log("✓ VIEWER:", viewer.email);

  // ─── Festivos nacionales de ejemplo 2026 ───────────────────────────────────
  const holidays2026 = [
    { date: new Date("2026-01-01"), description: "Año Nuevo" },
    { date: new Date("2026-01-06"), description: "Epifanía del Señor" },
    { date: new Date("2026-03-19"), description: "San José" },
    { date: new Date("2026-04-03"), description: "Viernes Santo" },
    { date: new Date("2026-05-01"), description: "Fiesta del Trabajo" },
    { date: new Date("2026-08-15"), description: "Asunción de la Virgen" },
    { date: new Date("2026-10-12"), description: "Fiesta Nacional de España" },
    { date: new Date("2026-11-01"), description: "Todos los Santos" },
    { date: new Date("2026-12-06"), description: "Día de la Constitución" },
    { date: new Date("2026-12-08"), description: "Inmaculada Concepción" },
    { date: new Date("2026-12-25"), description: "Natividad del Señor" },
  ];

  for (const h of holidays2026) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: { description: h.description, year: h.date.getFullYear() },
      create: { date: h.date, description: h.description, year: h.date.getFullYear() },
    });
  }
  console.log(`✓ ${holidays2026.length} festivos nacionales 2026 sembrados`);

  // ─── Sembrar turnos de Mayo 2026 ───────────────────────────────────────────
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

  // ─── Schedule record para Mayo 2026 ────────────────────────────────────────
  await prisma.schedule.upsert({
    where: { year_month: { year, month } },
    update: { generatedAt: new Date() },
    create: { year, month, published: false },
  });
  console.log(`✓ Schedule record Mayo 2026 creado`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());