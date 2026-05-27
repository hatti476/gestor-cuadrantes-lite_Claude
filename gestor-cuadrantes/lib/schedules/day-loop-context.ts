/**
 * @module day-loop-context
 * @description Tipos e interfaces que encapsulan el estado completo del loop día-por-día
 * del generador de cuadrantes. Elimina la necesidad de cierres que capturen variables
 * del scope exterior.
 */

import type { CoverageStatus, CoverageWarning } from "./coverage";

/**
 * Tipos de turno válidos en el dominio de planificación.
 */
export type ShiftType =
  | "M"
  | "T"
  | "N"
  | "J"
  | "D"
  | "V"
  | "B"
  | "MF"
  | "TF"
  | "NF"
  | "MN"
  | "TN"
  | "NN";

/**
 * Empleado elegible para planificación del cuadrante.
 */
export interface Employee {
  /** Identificador único del empleado. */
  id: string;
  /** Orden de rotación principal usado por el algoritmo. */
  rotationOrder: number;
  /** Preferencia de turno: mañana, tarde, jornada o sin preferencia explícita. */
  shiftPreference?: "M" | "T" | "J" | null;
  /** Nombre opcional para trazabilidad en logs/diagnóstico. */
  name?: string;
}

/**
 * Clave canónica de celda en formato `employeeId|YYYY-MM-DD`.
 */
export type CellKey = string;

/**
 * Celda bloqueada manualmente antes de generar.
 *
 * @remarks
 * Incluye celdas con V/B/D manual o cualquier asignación marcada como intocable.
 */
export interface LockedCell {
  /** Identificador de empleado de la celda bloqueada. */
  employeeId: string;
  /** Fecha ISO `YYYY-MM-DD` de la celda bloqueada. */
  date: string;
  /** Turno bloqueado que no debe sobreescribirse. */
  shiftType: ShiftType | string;
}

/**
 * Índice de celdas bloqueadas por clave `employeeId|YYYY-MM-DD`.
 */
export type LockedCellMap = Map<CellKey, LockedCell>;

/**
 * Asignación de turno de una celda generada por el loop.
 */
export interface AssignmentEntry {
  /** Identificador de empleado asignado. */
  employeeId: string;
  /** Fecha en formato ISO `YYYY-MM-DD`. */
  date: string;
  /** Turno asignado final en esa celda. */
  shiftType: ShiftType | string;
}

/**
 * Mapa de asignaciones del loop indexado por `employeeId|YYYY-MM-DD`.
 */
export type AssignmentMap = Map<CellKey, AssignmentEntry>;

/**
 * Bloque de noche materializado para el mes en curso.
 */
export interface NightBlockSlot {
  /** Empleado propietario del slot de bloque nocturno. */
  employeeId: string;
  /** Fecha ISO del slot. */
  date: string;
  /** Turno planificado por bloque (`N` o `D` normalmente). */
  shiftType: ShiftType | string;
}

/**
 * Plan de bloques de noche indexado por `employeeId|YYYY-MM-DD`.
 */
export type NightBlockPlan = Map<CellKey, NightBlockSlot>;

/**
 * Propietarios de paquete de fin de semana para un sábado ancla.
 */
export interface WeekendPackOwner {
  /** Empleado asignado a MF (o null si está vacante). */
  mfEmpId: string | null;
  /** Empleado asignado a TF (o null si está vacante). */
  tfEmpId: string | null;
}

/**
 * Plan de paquetes de fin de semana indexado por sábado `YYYY-MM-DD`.
 */
export type WeekendPackPlan = Map<string, WeekendPackOwner>;

/**
 * Continuidad del mes previo para resolver transiciones y arrastres.
 */
export interface PrevMonthContext {
  /** Turnos del mes anterior indexados por `employeeId|YYYY-MM-DD`. */
  previousMonthShiftByKey: Map<CellKey, ShiftType | string>;
  /** Días de descanso arrastrados al mes actual que no pueden convertirse en trabajo. */
  carriedRestDates: Set<CellKey>;
  /** Último estado consecutivo por empleado al cerrar el mes anterior. */
  trailingStateByEmployee: Map<string, { shift: ShiftType | string | null; count: number; forcedRestDaysRemaining: number }>;
}

/**
 * Contexto preparado para continuidad hacia el mes siguiente.
 */
export interface NextMonthContext {
  /** Fecha ISO del primer día del mes siguiente. */
  firstDate: string;
  /** Metadatos de continuidad que se deben exportar al cerrar el loop. */
  continuityHints: Map<string, string | number | boolean>;
}

/**
 * Parámetros de entrada del loop (inmutables durante la ejecución).
 */
export interface DayLoopInput {
  projectId: string;
  month: number;
  year: number;
  employees: Employee[];
  holidays: Date[];
  lockedCells: LockedCellMap;
  nightBlockPlan: NightBlockPlan;
  weekendPackPlan: WeekendPackPlan;
  prevMonthContext: PrevMonthContext;
  nextMonthContext: NextMonthContext;
}

/**
 * Estado mutable que evoluciona día a día.
 */
export interface DayLoopState {
  assignments: AssignmentMap;
  weeklyShifts: Record<string, ShiftType>;
  consecutiveWorkDays: Record<string, number>;
  consecutiveRestDays: Record<string, number>;
  currentWeekendShifts: Record<string, ShiftType>;
}

/**
 * Resultados acumulados del loop.
 */
export interface DayLoopOutput {
  assignments: AssignmentMap;
  warnings: CoverageWarning[];
  coverageSummary: Record<string, CoverageStatus>;
}
