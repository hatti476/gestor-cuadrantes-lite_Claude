import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// SPEC-012 AC-22: al imprimir, las celdas de turno deben conservar su color
// de fondo. Chrome/Edge/Firefox lo omiten por defecto salvo que se fuerce con
// print-color-adjust (y su prefijo -webkit-).

describe("app/globals.css — @media print conserva colores (SPEC-012 AC-22)", () => {
  const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf-8");

  it("existe el bloque @media print", () => {
    expect(css).toMatch(/@media print\s*{/);
  });

  it("fuerza la conservación de colores de fondo al imprimir", () => {
    expect(css).toMatch(/-webkit-print-color-adjust:\s*exact/);
    expect(css).toMatch(/(?<!-webkit-)print-color-adjust:\s*exact/);
  });
});
