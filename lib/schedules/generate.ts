/**
 * @module generate
 * @description Orquestador de generación mensual de cuadrantes.
 *
 * Este archivo mantiene el punto de entrada estable del dominio
 * (`generateMonthSchedule`) y delega la lógica de negocio al engine
 * especializado del loop mensual.
 */

import {
  generateMonthSchedule as runMonthlyScheduleEngine,
  type GeneratedAssignment,
  type PrevMonthTail,
  type ScheduleEmployee,
} from "./monthly-schedule-engine";
import type { GenerateMonthScheduleOptions } from "./coverage";

export type {
  GeneratedAssignment,
  PrevMonthTail,
  ScheduleEmployee,
  GenerationWarning,
  CoverageWarning,
  GenerateMonthScheduleOptions,
  NightBlock,
} from "./monthly-schedule-engine";

export {
  VALID_SHIFTS,
  nightBlockDays,
  computeNightBlocks,
  resolveNightBlocks,
  NIGHT_EPOCH_FRIDAY,
  BLOCK_DAYS,
  NIGHT_DAYS,
  isWeekend,
  toDateStr,
  fromDateStr,
  addDays,
  isWeekendOrHoliday,
  applySpecialDayRule,
  applyChristmasSpecialRule,
  normalizeShift,
  weekKey,
  isDayWorkShift,
  countTrailingDayWork,
  countTrailingShift,
  initialForcedRestDaysRemaining,
  isPostRestDay,
  countConsecutiveWorkDays,
  getExtendedWeekend,
} from "./monthly-schedule-engine";

/**
 * Genera un cuadrante mensual completo.
 *
 * @remarks
 * `generate.ts` actúa como orquestador puro y mantiene un contrato
 * estable para consumidores externos. La lógica de negocio detallada
 * reside en el engine especializado.
 */
export function generateMonthSchedule(
  employees: ScheduleEmployee[],
  year: number,
  month: number,
  existingDates: Set<string> = new Set(),
  holidayDates: Set<string> = new Set(),
  prevMonthTail: PrevMonthTail[] = [],
  nightRotationIds?: string[],
  options: GenerateMonthScheduleOptions = {}
): GeneratedAssignment[] {
  // ─── SECCIÓN: Validación de entrada ──────────────────────
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error("year y month deben ser enteros");
  }
  if (month < 1 || month > 12) {
    throw new Error("month debe estar entre 1 y 12");
  }

  // ─── SECCIÓN: Carga de datos ──────────────────────────────
  const safeEmployees = employees ?? [];
  const safeExistingDates = existingDates ?? new Set<string>();
  const safeHolidayDates = holidayDates ?? new Set<string>();

  // ─── SECCIÓN: Contexto cross-month ───────────────────────
  const safePrevMonthTail = prevMonthTail ?? [];

  // ─── SECCIÓN: Planes previos al loop ─────────────────────
  const safeNightRotationIds = nightRotationIds;

  // ─── SECCIÓN: Ejecución del loop ──────────────────────────
  const generated = runMonthlyScheduleEngine(
    safeEmployees,
    year,
    month,
    safeExistingDates,
    safeHolidayDates,
    safePrevMonthTail,
    safeNightRotationIds,
    options
  );

  // ─── SECCIÓN: Persistencia ────────────────────────────────
  // No aplica en este módulo: la persistencia se realiza en la capa API.

  // ─── SECCIÓN: Respuesta ───────────────────────────────────
  return generated;
}
