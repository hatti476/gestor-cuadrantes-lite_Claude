/** Tipos compartidos para el cuadrante — usados por API, componentes y hooks */

export interface ScheduleEmployee {
  id: string;
  name: string;
  rotationOrder: number;
  shiftPreference?: string | null;
  /** Id del usuario (User.id) vinculado a este empleado — para resaltar la fila propia */
  userId?: string | null;
}

export interface ScheduleAssignment {
  id: string;
  employeeId: string;
  /** Fecha ISO string "YYYY-MM-DD" */
  date: string;
  shiftType: string;
  /** true si fue asignado manualmente (no auto-generado) — Sprint 11 */
  manual?: boolean;
  employee?: ScheduleEmployee;
}

/** Estado del mes según las asignaciones existentes */
export type MonthStatus = "ungenerated" | "preparation" | "generated";

/**
 * Calcula el estado del mes a partir de las asignaciones.
 * - "ungenerated": sin asignaciones
 * - "preparation": solo V/B/D manuales
 * - "generated": hay al menos un turno M/T/N/MF/TF/NF
 */
export function computeMonthStatus(assignments: Pick<ScheduleAssignment, "shiftType">[]): MonthStatus {
  if (assignments.length === 0) return "ungenerated";
  const GENERATED_TYPES = new Set(["M", "T", "N", "MF", "TF", "NF"]);
  const hasGenerated = assignments.some((a) => GENERATED_TYPES.has(a.shiftType));
  return hasGenerated ? "generated" : "preparation";
}
