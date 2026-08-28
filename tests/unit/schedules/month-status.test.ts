import { describe, it, expect } from "vitest";
import { computeMonthStatus } from "@/lib/schedules/types";

describe("computeMonthStatus", () => {
  it("sin asignaciones → ungenerated", () => {
    expect(computeMonthStatus([])).toBe("ungenerated");
  });

  it("solo V y D → preparation", () => {
    expect(
      computeMonthStatus([{ shiftType: "V" }, { shiftType: "D" }])
    ).toBe("preparation");
  });

  it("solo B → preparation", () => {
    expect(computeMonthStatus([{ shiftType: "B" }])).toBe("preparation");
  });

  it("solo J → preparation", () => {
    expect(computeMonthStatus([{ shiftType: "J" }])).toBe("preparation");
  });

  it("M junto a V → generated", () => {
    expect(
      computeMonthStatus([{ shiftType: "M" }, { shiftType: "V" }])
    ).toBe("generated");
  });

  it("T → generated", () => {
    expect(computeMonthStatus([{ shiftType: "T" }])).toBe("generated");
  });

  it("N → generated", () => {
    expect(computeMonthStatus([{ shiftType: "N" }])).toBe("generated");
  });

  it("MF → generated", () => {
    expect(computeMonthStatus([{ shiftType: "MF" }])).toBe("generated");
  });

  it("TF → generated", () => {
    expect(computeMonthStatus([{ shiftType: "TF" }])).toBe("generated");
  });

  it("NF → generated", () => {
    expect(computeMonthStatus([{ shiftType: "NF" }])).toBe("generated");
  });
});
