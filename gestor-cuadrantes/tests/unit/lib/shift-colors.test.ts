import { describe, it, expect } from "vitest";
import { SHIFT_COLORS, getShiftConfig } from "@/lib/constants/shift-colors";

describe("SHIFT_COLORS", () => {
  it("contiene los 7 tipos de turno principales", () => {
    const required = ["M", "T", "N", "J", "D", "V", "B"];
    required.forEach((key) => {
      expect(SHIFT_COLORS).toHaveProperty(key);
    });
  });

  it("cada turno tiene color, textColor y label", () => {
    Object.entries(SHIFT_COLORS).forEach(([, config]) => {
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("textColor");
      expect(config).toHaveProperty("label");
    });
  });

  it("M es naranja (#FF9800)", () => {
    expect(SHIFT_COLORS.M.color).toBe("#FF9800");
  });

  it("T es azul (#2196F3)", () => {
    expect(SHIFT_COLORS.T.color).toBe("#2196F3");
  });

  it("N es verde (#4CAF50)", () => {
    expect(SHIFT_COLORS.N.color).toBe("#4CAF50");
  });
});

describe("getShiftConfig", () => {
  it("devuelve la config correcta para un turno conocido", () => {
    const config = getShiftConfig("M");
    expect(config.color).toBe("#FF9800");
    expect(config.label).toBe("Mañana");
  });

  it("devuelve config de fallback para turno desconocido", () => {
    const config = getShiftConfig("X");
    expect(config).toBeDefined();
    expect(config.label).toBe("X");
  });
});
