/**
 * @module day-loop
 * @description Loop día-por-día del generador de cuadrantes.
 * Itera sobre cada día del mes en orden cronológico estricto
 * y determina el turno de cada empleado aplicando las reglas
 * de negocio en el orden de prioridad establecido.
 *
 * @dependencies
 * - night-blocks.ts: plan de bloques de noche
 * - weekend-packs.ts: plan de paquetes de fin de semana
 * - workday-shifts.ts: asignación de turnos laborables
 * - rest-rules.ts: reglas de descanso HARD
 * - coverage.ts: validación de cobertura mínima
 * - shift-transitions.ts: validación ET Art.34.3
 * - day-loop-context.ts: tipos de contexto
 *
 * @consumers
 * - generate.ts: orquestador principal
 */

import { evaluateDayCoverage } from "./coverage";
import { addDays, applyChristmasSpecialRule, isWeekend, normalizeShift, toDateStr, weekKey } from "./date-utils";
import { isValidShiftType, validateShiftTransition } from "./shift-transitions";
import { pickWeekendShift } from "./weekend-packs";
import { pickWorkdayShift } from "./workday-shifts";
import type { CoverageStatus } from "./coverage";
import type { AssignmentEntry, AssignmentMap, DayLoopInput, DayLoopOutput, DayLoopState, Employee, ShiftType } from "./day-loop-context";

interface EmployeeRuntimeState {
  mCount: number;
  tCount: number;
  weekShift: Map<string, string>;
  weekendShift: Map<string, "MF" | "TF">;
}

function createCellKey(employeeId: string, date: string): string {
  return `${employeeId}|${date}`;
}

function toHolidaySet(holidays: Date[]): Set<string> {
  return new Set(holidays.map((holiday) => toDateStr(holiday)));
}

function initRuntimeState(employees: Employee[]): Map<string, EmployeeRuntimeState> {
  const state = new Map<string, EmployeeRuntimeState>();
  for (const employee of employees) {
    state.set(employee.id, {
      mCount: 0,
      tCount: 0,
      weekShift: new Map<string, string>(),
      weekendShift: new Map<string, "MF" | "TF">(),
    });
  }
  return state;
}

function getPrevShift(
  employeeId: string,
  date: Date,
  assignments: AssignmentMap,
  previousMonthShiftByKey: Map<string, ShiftType | string>
): string | null {
  const prevDate = toDateStr(addDays(date, -1));
  const key = createCellKey(employeeId, prevDate);
  return assignments.get(key)?.shiftType ?? previousMonthShiftByKey.get(key) ?? null;
}

function getWeekendSaturdayForDate(date: Date, holidaySet: Set<string>): Date | null {
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 6) return date;
  if (dayOfWeek === 0) return addDays(date, -1);
  const isHolidayDay = holidaySet.has(toDateStr(date));
  if (!isHolidayDay) return null;

  let forward = addDays(date, 1);
  while (!isWeekend(forward)) {
    if (!holidaySet.has(toDateStr(forward))) break;
    forward = addDays(forward, 1);
  }
  if (forward.getUTCDay() === 6) return forward;

  let backward = addDays(date, -1);
  while (!isWeekend(backward)) {
    if (!holidaySet.has(toDateStr(backward))) break;
    backward = addDays(backward, -1);
  }
  if (backward.getUTCDay() === 0) return addDays(backward, -1);
  if (backward.getUTCDay() === 6) return backward;

  return null;
}

function getWeekendPackageDates(saturday: Date, holidaySet: Set<string>, year: number, month: number): string[] {
  const inMonth = (candidate: Date): boolean =>
    candidate.getUTCFullYear() === year && candidate.getUTCMonth() + 1 === month;

  const sunday = addDays(saturday, 1);
  const packageDates: Date[] = [];

  let back = addDays(saturday, -1);
  const backHolidays: Date[] = [];
  while (inMonth(back) && holidaySet.has(toDateStr(back))) {
    backHolidays.unshift(back);
    back = addDays(back, -1);
  }
  packageDates.push(...backHolidays);

  if (inMonth(saturday)) packageDates.push(saturday);
  if (inMonth(sunday)) packageDates.push(sunday);

  let forward = addDays(sunday, 1);
  while (inMonth(forward) && holidaySet.has(toDateStr(forward))) {
    packageDates.push(forward);
    forward = addDays(forward, 1);
  }

  return packageDates.map((d) => toDateStr(d));
}

function resolveWeekendShift(
  employeeId: string,
  date: Date,
  holidaySet: Set<string>,
  weekendPackPlan: Map<string, { mfEmpId: string | null; tfEmpId: string | null }>,
  year: number,
  month: number
): "MF" | "TF" | "D" | null {
  const saturday = getWeekendSaturdayForDate(date, holidaySet);
  if (!saturday) return null;

  const packageDates = getWeekendPackageDates(saturday, holidaySet, year, month);
  if (!packageDates.includes(toDateStr(date))) return null;

  const owner = weekendPackPlan.get(toDateStr(saturday));
  if (!owner) return "D";
  if (owner.mfEmpId === employeeId) return "MF";
  if (owner.tfEmpId === employeeId) return "TF";
  return "D";
}

function updateConsecutiveState(state: DayLoopState, employeeId: string, shiftType: string): void {
  const baseShift = normalizeShift(shiftType);
  const isWorkDay = baseShift === "M" || baseShift === "T" || baseShift === "J";
  const previousWorkDays = state.consecutiveWorkDays[employeeId] ?? 0;
  const previousRestDays = state.consecutiveRestDays[employeeId] ?? 0;

  if (isWorkDay) {
    state.consecutiveWorkDays[employeeId] = previousWorkDays + 1;
    state.consecutiveRestDays[employeeId] = 0;
  } else if (baseShift === "D") {
    state.consecutiveRestDays[employeeId] = previousRestDays + 1;
    state.consecutiveWorkDays[employeeId] = 0;
  } else {
    state.consecutiveWorkDays[employeeId] = 0;
    state.consecutiveRestDays[employeeId] = 0;
  }
}

/**
 * Ejecuta el loop día-por-día para un mes completo.
 * Procesa cada día en orden cronológico estricto (día 1 → día N).
 * No altera el comportamiento del algoritmo respecto a
 * la implementación previa en generate.ts.
 *
 * @param input - Parámetros inmutables del loop
 * @returns Asignaciones completas del mes y warnings
 * @example
 * ```ts
 * const output = executeDayLoop({
 *   year: 2026,
 *   month: 6,
 *   employees,
 *   holidays,
 *   lockedCells,
 *   nightBlockPlan,
 *   weekendPackPlan,
 *   prevMonthContext,
 *   nextMonthContext,
 * });
 * ```
 * @remarks
 * El orden de prioridad por celda es estricto:
 * bloqueos manuales > descanso HARD > night block > weekend pack > laborable > transición ET > cobertura.
 */
export function executeDayLoop(input: DayLoopInput): DayLoopOutput {
  const sortedEmployees = [...input.employees].sort((a, b) => a.rotationOrder - b.rotationOrder);
  const holidaySet = toHolidaySet(input.holidays);
  const runtime = initRuntimeState(sortedEmployees);

  const state: DayLoopState = {
    assignments: new Map<string, AssignmentEntry>(),
    weeklyShifts: {},
    consecutiveWorkDays: {},
    consecutiveRestDays: {},
    currentWeekendShifts: {},
  };

  const warnings = [] as DayLoopOutput["warnings"];
  const coverageSummary: Record<string, CoverageStatus> = {};
  const forcedRestRemaining: Record<string, number> = {};

  const daysInMonth = new Date(input.year, input.month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(input.year, input.month - 1, day));
    const dateStr = toDateStr(date);
    const dayCoverage = { M: 0, T: 0 };
    const wKey = weekKey(date);
    const dayIsHoliday = holidaySet.has(dateStr);
    const dayIsWeekendOrHoliday = isWeekend(date) || dayIsHoliday;

    for (const employee of sortedEmployees) {
      const cellKey = createCellKey(employee.id, dateStr);
      const employeeRuntime = runtime.get(employee.id)!;

      let shift: ShiftType | string;

      const locked = input.lockedCells.get(cellKey);
      if (locked) {
        shift = locked.shiftType;
      } else if ((forcedRestRemaining[employee.id] ?? 0) > 0) {
        shift = "D";
        forcedRestRemaining[employee.id] = Math.max(0, (forcedRestRemaining[employee.id] ?? 0) - 1);
      } else if ((state.consecutiveWorkDays[employee.id] ?? 0) >= 5) {
        shift = "D";
        forcedRestRemaining[employee.id] = 1;
      } else {
        const nightSlot = input.nightBlockPlan.get(cellKey);
        if (nightSlot) {
          shift = nightSlot.shiftType;
        } else {
          const packageShift = resolveWeekendShift(
            employee.id,
            date,
            holidaySet,
            input.weekendPackPlan,
            input.year,
            input.month
          );

          if (packageShift !== null) {
            shift = applyChristmasSpecialRule(packageShift, date);
          } else if (dayIsHoliday) {
            shift = applyChristmasSpecialRule(
              pickWeekendShift(employee, employeeRuntime, dayCoverage, wKey),
              date
            );
          } else {
            shift = applyChristmasSpecialRule(
              pickWorkdayShift(employee, {
                ...employeeRuntime,
                consecutiveShift: null,
                consecutiveCount: state.consecutiveWorkDays[employee.id] ?? 0,
              }, dayCoverage, wKey),
              date
            );
          }
        }
      }

      const prevShift = getPrevShift(
        employee.id,
        date,
        state.assignments,
        input.prevMonthContext.previousMonthShiftByKey
      );
      if (
        prevShift &&
        isValidShiftType(prevShift) &&
        isValidShiftType(shift) &&
        !validateShiftTransition(prevShift, shift).valid
      ) {
        shift = "D";
        warnings.push({
          date: dateStr,
          employeeId: employee.id,
          message: `Transición inválida ${prevShift}→${shift} en ${dateStr}`,
        });
      }

      const normalized = normalizeShift(shift);
      if (normalized === "M") dayCoverage.M++;
      if (normalized === "T") dayCoverage.T++;

      if ((shift === "MF" || shift === "TF") && !state.currentWeekendShifts[employee.id]) {
        state.currentWeekendShifts[employee.id] = shift;
      }
      if ((normalized === "M" || normalized === "T") && !state.weeklyShifts[createCellKey(employee.id, wKey)]) {
        state.weeklyShifts[createCellKey(employee.id, wKey)] = normalized;
      }

      state.assignments.set(cellKey, {
        employeeId: employee.id,
        date: dateStr,
        shiftType: shift,
      });
      updateConsecutiveState(state, employee.id, shift);
    }

    const availableCount = sortedEmployees.filter((employee) => {
      const key = createCellKey(employee.id, dateStr);
      return !input.lockedCells.has(key);
    }).length;

    const coverage = evaluateDayCoverage(
      date,
      dayCoverage.M,
      dayCoverage.T,
      availableCount,
      dayIsWeekendOrHoliday
    );
    if (availableCount === 0) {
      warnings.push({
        date: dateStr,
        employeeId: "",
        message: `Cobertura crítica: 0 empleados disponibles en ${dateStr}.`,
      });
    }
    coverageSummary[dateStr] = coverage;
    warnings.push(...coverage.warnings);
  }

  return {
    assignments: state.assignments,
    warnings,
    coverageSummary,
  };
}
