import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
    });
    console.log("✓", user.email);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
