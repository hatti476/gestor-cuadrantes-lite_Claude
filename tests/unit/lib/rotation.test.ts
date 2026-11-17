import { describe, expect, test } from "vitest";

import { isRotationDirection, moveInRotation } from "@/lib/employees/rotation";

// SPEC-010 H-09: orden de rotación de noches editable desde /admin

describe("moveInRotation", () => {
  const ids = ["a", "b", "c", "d"];

  test("subir intercambia con el anterior", () => {
    expect(moveInRotation(ids, "c", "up")).toEqual(["a", "c", "b", "d"]);
  });

  test("bajar intercambia con el siguiente", () => {
    expect(moveInRotation(ids, "b", "down")).toEqual(["a", "c", "b", "d"]);
  });

  test("subir el primero o bajar el último no cambia nada", () => {
    expect(moveInRotation(ids, "a", "up")).toEqual(ids);
    expect(moveInRotation(ids, "d", "down")).toEqual(ids);
  });

  test("id que no está en la rotación → null", () => {
    expect(moveInRotation(ids, "zzz", "up")).toBeNull();
  });

  test("no muta el array de entrada", () => {
    const input = [...ids];
    moveInRotation(input, "b", "down");
    expect(input).toEqual(ids);
  });
});

describe("isRotationDirection", () => {
  test("solo acepta up y down", () => {
    expect(isRotationDirection("up")).toBe(true);
    expect(isRotationDirection("down")).toBe(true);
    expect(isRotationDirection("left")).toBe(false);
    expect(isRotationDirection(undefined)).toBe(false);
  });
});
