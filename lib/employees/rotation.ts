/**
 * lib/employees/rotation.ts
 * Orden de rotación de noches (Employee.rotationOrder). Funciones puras.
 * La generación usa los empleados activos ordenados por rotationOrder
 * (app/api/schedules/generate/route.ts).
 */

export type RotationDirection = "up" | "down";

export function isRotationDirection(value: unknown): value is RotationDirection {
  return value === "up" || value === "down";
}

/**
 * Devuelve el orden resultante de mover `id` una posición arriba o abajo.
 * En los extremos devuelve el mismo orden; si `id` no está, null.
 */
export function moveInRotation(
  orderedIds: string[],
  id: string,
  direction: RotationDirection
): string[] | null {
  const index = orderedIds.indexOf(id);
  if (index === -1) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  const result = [...orderedIds];
  if (target < 0 || target >= result.length) return result;
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
