import { describe, expect, it } from "vitest";
import {
  computeNightBlocks,
  generateMonthSchedule,
  nightBlockDays,
  normalizeShift,
  toDateStr,
} from "@/lib/schedules/generate";

type TestEmployee = {
  id: string;
  rotationOrder: number;
  shiftPreference?: "M" | "T" | "J" | null;
};

function makeEmployees(): TestEmployee[] {
  return Array.from({ length: 7 }, (_, index) => ({
    id: `emp-${index + 1}`,
    rotationOrder: index,
    shiftPreference: null,
  }));
}

describe("night blocks regression", () => {
  it("maintains a fully assigned grid for May 2026 with 7 employees and no incidents", () => {
    const employees = makeEmployees();
    const assignments = generateMonthSchedule(
      employees,
      2026,
      5,
      new Set<string>(),
      new Set<string>(),
      [],
      employees.map((employee) => employee.id)
    );

    expect(assignments).toHaveLength(31 * employees.length);

    const byEmployeeDate = new Set(
      assignments.map((assignment) => `${assignment.employeeId}|${toDateStr(assignment.date)}`)
    );

    for (const employee of employees) {
      for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-05-${String(day).padStart(2, "0")}`;
        expect(byEmployeeDate.has(`${employee.id}|${dateStr}`)).toBe(true);
      }
    }
  });

  it("never allows relaxed coverage repair to overwrite a night-block rest day", () => {
    const employees = makeEmployees();
    const ids = employees.map((employee) => employee.id);
    const rawBlocks = computeNightBlocks(2026, 6, ids);
    const targetBlock = rawBlocks.find((block) => block.employeeId === "emp-1");

    expect(targetBlock).toBeDefined();

    const targetRestDate = [...nightBlockDays(targetBlock!).entries()].find(([dateStr, shift]) => {
      if (shift !== "D") return false;
      return dateStr.startsWith("2026-06-");
    })?.[0];

    expect(targetRestDate).toBeDefined();

    const lockedDates = new Set<string>();
    for (const employee of employees) {
      if (employee.id === "emp-1") continue;
      lockedDates.add(`${employee.id}|${targetRestDate}`);
    }

    const assignments = generateMonthSchedule(
      employees,
      2026,
      6,
      lockedDates,
      new Set<string>(),
      [],
      ids
    );

    const emp1Assignment = assignments.find(
      (assignment) =>
        assignment.employeeId === "emp-1" &&
        toDateStr(assignment.date) === targetRestDate
    );

    expect(emp1Assignment).toBeDefined();
    expect(normalizeShift(emp1Assignment!.shiftType)).toBe("D");
  });
});

describe("night blocks by rotation order", () => {
  const employees = makeEmployees();
  const ids = employees.map((employee) => employee.id);

  it("keeps rotation order 0 anchored to Friday", () => {
    const block = computeNightBlocks(2026, 5, ids).find((candidate) => candidate.employeeId === "emp-1");
    expect(block).toBeDefined();
    expect(block!.startFriday.getUTCDay()).toBe(5);
  });

  for (let rotationOrder = 0; rotationOrder < 7; rotationOrder++) {
    it(`builds a complete 2D+7N+3D block for rotationOrder=${rotationOrder}`, () => {
      const employeeId = `emp-${rotationOrder + 1}`;
      let block = computeNightBlocks(2026, 1, ids).find((candidate) => candidate.employeeId === employeeId);
      for (let month = 2; month <= 12 && !block; month++) {
        block = computeNightBlocks(2026, month, ids).find((candidate) => candidate.employeeId === employeeId);
      }
      expect(block).toBeDefined();

      const days = nightBlockDays(block!);
      expect(days.size).toBe(12);

      const distribution = [...days.values()].reduce(
        (acc, shift) => {
          acc[shift] = (acc[shift] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(distribution.D).toBe(5);
      expect(distribution.N).toBe(7);
    });
  }
});
