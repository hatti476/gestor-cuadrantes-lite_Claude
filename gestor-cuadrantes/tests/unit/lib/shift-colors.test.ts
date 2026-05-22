import { describe, it, expect } from "vitest";
import { SHIFT_COLORS, getShiftConfig } from "@/lib/constants/shift-colors";

describe("SHIFT_COLORS", () => {
  it("contiene los 7 tipos de turno principales", () => {
    const required = ["M", "T", "N", "J", "D", "V", "B"];
    required.forEach((key) => {
      expect(SHIFT_COLORS).toHaveProperty(key);
    });
  });

  it("contiene los turnos especiales de Navidad", () => {
    ["MN", "TN", "NN"].forEach((key) => {
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

  it("M es naranja unificado (#F97316)", () => {
    expect(SHIFT_COLORS.M.color).toBe("#F97316");
  });

  it("MF tiene el mismo naranja que M (#F97316)", () => {
    expect(SHIFT_COLORS.MF.color).toBe("#F97316");
  });

  it("T es azul unificado (#3B82F6)", () => {
    expect(SHIFT_COLORS.T.color).toBe("#3B82F6");
  });

  it("TF tiene el mismo azul que T (#3B82F6)", () => {
    expect(SHIFT_COLORS.TF.color).toBe("#3B82F6");
  });

  it("N es verde unificado (#16A34A)", () => {
    expect(SHIFT_COLORS.N.color).toBe("#16A34A");
  });

  it("NF tiene el mismo verde que N (#16A34A)", () => {
    expect(SHIFT_COLORS.NF.color).toBe("#16A34A");
  });

  it("V (vacaciones) tiene fondo negro", () => {
    expect(SHIFT_COLORS.V.color).toBe("#111827");
    expect(SHIFT_COLORS.V.textColor).toBe("#FFFFFF");
  });

  it("B (baja) tiene fondo negro", () => {
    expect(SHIFT_COLORS.B.color).toBe("#111827");
    expect(SHIFT_COLORS.B.textColor).toBe("#FFFFFF");
  });

  it("NN usa fondo verde oscuro (turno especial de Navidad)", () => {
    expect(SHIFT_COLORS.NN.color).toBe("#0B6B2B");
  });
});

describe("getShiftConfig", () => {
  it("devuelve la config correcta para un turno conocido", () => {
    const config = getShiftConfig("M");
    expect(config.color).toBe("#F97316");
    expect(config.label).toBe("Mañana");
  });

  it("devuelve config de fallback para turno desconocido", () => {
    const config = getShiftConfig("X");
    expect(config).toBeDefined();
    expect(config.label).toBe("X");
  });
});
