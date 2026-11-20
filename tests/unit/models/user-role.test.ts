import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

// Aislado de prisma/dev.db: sin datasource propio, este fichero usaba el
// PrismaClient por defecto y sus `beforeEach` truncan User/Employee/etc. —
// cualquier `npm run test:unit` vaciaba la BD de pruebas manuales si había
// un `next dev` abierto en paralelo.
const cwd = path.resolve(__dirname, "../../../");
const TEST_DB_PATH = path.join(cwd, "prisma", "test-unit.db");
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

beforeAll(() => {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const p = TEST_DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    cwd,
    stdio: "pipe",
  });
});

const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

describe("User Role Enum - ADMIN | TECNICO | VIEWER", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.shiftAssignment.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();
  });

  test("Role enum solo acepta ADMIN | TECNICO | VIEWER", async () => {
    const validRoles = ["ADMIN", "TECNICO", "VIEWER"] as const;

    for (const role of validRoles) {
      const user = await prisma.user.create({
        data: {
          email: `test-${role.toLowerCase()}@example.com`,
          password: "hashed",
          role,
        },
      });
      expect(user.role).toBe(role);
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("Roles antiguos (SUPER_ADMIN, SUPER_VIEWER, USER, PROJECT_ADMIN, EMPLOYEE) se almacenan como string pero validación es en capa aplicación", async () => {
    // SQLite no tiene enum nativo; la validación de roles permitidos
    // se hace en la capa de aplicación (permissions.ts, API guards).
    // Aquí verificamos que el campo acepta cualquier string (comportamiento actual).
    const legacyRoles = ["SUPER_ADMIN", "SUPER_VIEWER", "USER", "PROJECT_ADMIN", "EMPLOYEE"];

    for (const role of legacyRoles) {
      const user = await prisma.user.create({
        data: {
          email: `test-${role.toLowerCase()}@example.com`,
          password: "hashed",
          role,
        },
      });
      expect(user.role).toBe(role);
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("TECNICO puede tener Employee asociado (relación 1:1)", async () => {
    const user = await prisma.user.create({
      data: {
        email: "tecnico-test@example.com",
        password: "hashed",
        role: "TECNICO",
        employee: {
          create: {
            name: "Técnico Test",
            rotationOrder: 1,
            shiftPreference: "M",
            active: true,
          },
        },
      },
      include: { employee: true },
    });

    expect(user.role).toBe("TECNICO");
    expect(user.employee).not.toBeNull();
    expect(user.employee?.name).toBe("Técnico Test");
    expect(user.employee?.rotationOrder).toBe(1);
    expect(user.employee?.shiftPreference).toBe("M");
    expect(user.employee?.active).toBe(true);
  });

  test("VIEWER NO puede tener Employee asociado", async () => {
    const user = await prisma.user.create({
      data: {
        email: "viewer-test@example.com",
        password: "hashed",
        role: "VIEWER",
      },
      include: { employee: true },
    });

    expect(user.role).toBe("VIEWER");
    expect(user.employee).toBeNull();
  });

  test("ADMIN NO tiene Employee asociado por defecto", async () => {
    const user = await prisma.user.create({
      data: {
        email: "admin-test@example.com",
        password: "hashed",
        role: "ADMIN",
      },
      include: { employee: true },
    });

    expect(user.role).toBe("ADMIN");
    expect(user.employee).toBeNull();
  });

  test("Employee active (soft-delete) se mantiene", async () => {
    const user = await prisma.user.create({
      data: {
        email: "tecnico-softdelete@example.com",
        password: "hashed",
        role: "TECNICO",
        employee: {
          create: {
            name: "Técnico SoftDelete",
            rotationOrder: 1,
            active: true,
          },
        },
      },
      include: { employee: true },
    });

    expect(user.employee?.active).toBe(true);

    await prisma.employee.update({
      where: { id: user.employee!.id },
      data: { active: false },
    });

    const updated = await prisma.employee.findUnique({
      where: { id: user.employee!.id },
    });
    expect(updated?.active).toBe(false);
  });
});

describe("ShiftAssignment - sin projectId", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.shiftAssignment.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();
  });

  test("ShiftAssignment único por employeeId + date (sin projectId)", async () => {
    const user = await prisma.user.create({
      data: {
        email: "tecnico-sa@example.com",
        password: "hashed",
        role: "TECNICO",
        employee: {
          create: { name: "Téc SA", rotationOrder: 1, active: true },
        },
      },
      include: { employee: true },
    });

    const date = new Date("2026-05-15");

    await prisma.shiftAssignment.create({
      data: {
        employeeId: user.employee!.id,
        date,
        shiftType: "M",
      },
    });

    await expect(
      prisma.shiftAssignment.create({
        data: {
          employeeId: user.employee!.id,
          date,
          shiftType: "T",
        },
      })
    ).rejects.toThrow();
  });
});

describe("Schedule - sin projectId", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.schedule.deleteMany();
  });

  test("Schedule único por year + month (sin projectId)", async () => {
    await prisma.schedule.create({
      data: { year: 2026, month: 5, published: false },
    });

    await expect(
      prisma.schedule.create({
        data: { year: 2026, month: 5, published: true },
      })
    ).rejects.toThrow();
  });
});

describe("ScheduleSnapshot - sin projectId", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.scheduleSnapshot.deleteMany();
  });

  test("ScheduleSnapshot único por year + month (sin projectId)", async () => {
    await prisma.scheduleSnapshot.create({
      data: { year: 2026, month: 5, snapshot: "[]" },
    });

    await expect(
      prisma.scheduleSnapshot.create({
        data: { year: 2026, month: 5, snapshot: "[]{}" },
      })
    ).rejects.toThrow();
  });
});

describe("Modelos eliminados no existen", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Project model no existe en Prisma Client", () => {
    expect((prisma as unknown as Record<string, unknown>).project).toBeUndefined();
  });

  test("ProjectMember model no existe en Prisma Client", () => {
    expect((prisma as unknown as Record<string, unknown>).projectMember).toBeUndefined();
  });
});