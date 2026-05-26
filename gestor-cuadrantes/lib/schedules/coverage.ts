/**
 * @module coverage
 * @description Validación de cobertura mínima diaria (hard y soft).
 *              RF-16: ≥1M + ≥1T en laborables; ≥1MF + ≥1TF en fines de semana.
 *              Soft target: ≥2M + ≥2T en días laborables.
 * @dependencies date-utils (isWeekend)
 */

// ─── SECCIÓN: Tipos de cobertura ──────────────────────────────────────────

/** Warning emitido cuando una transición de turno viola el mínimo de 12h ET Art.34.3 */
export interface GenerationWarning {
  employeeId: string;
  date: string;
  prevShift: string;
  nextShift: string;
  hoursGap: number;
  reason: string;
}

/** Warning emitido cuando un día tiene cobertura reducida por reglas de descanso obligatorio */
export interface CoverageWarning {
  date: string; // "YYYY-MM-DD"
  employeeId: string;
  message: string;
}

export interface GenerateMonthScheduleOptions {
  existingAssignments?: Map<string, string>;
  warnings?: GenerationWarning[];
  coverageWarnings?: CoverageWarning[];
}

// ─── SECCIÓN: Evaluación de cobertura ────────────────────────────────────

export interface CoverageStatus {
  /** true si se cumple el mínimo hard: ≥1M + ≥1T (laborable) o ≥1MF + ≥1TF (finde) */
  hardMet: boolean;
  /** true si se cumple el objetivo soft: ≥2M + ≥2T (solo laborables) */
  softMet: boolean;
  /** Warnings generados si la cobertura hard no se cumple */
  warnings: CoverageWarning[];
}

/**
 * Evalúa la cobertura de un día a partir de los turnos asignados.
 *
 * @param date - Fecha a evaluar
 * @param mCount - Número de asignaciones M/MF en el día
 * @param tCount - Número de asignaciones T/TF en el día
 * @param availableCount - Número total de empleados disponibles (sin V/B/manual)
 * @param isWeekendOrHolidayDay - true si es fin de semana o festivo
 * @returns CoverageStatus con hardMet, softMet y warnings
 *
 * @example
 * // Día laborable con 2M y 2T:
 * evaluateDayCoverage(date, 2, 2, 7, false)
 * // → { hardMet: true, softMet: true, warnings: [] }
 *
 * @remarks
 * REGLA RF-16: cobertura hard es obligatoria; soft es best-effort.
 * Los warnings de cobertura soft no bloquean la generación.
 */
export function evaluateDayCoverage(
  date: Date,
  mCount: number,
  tCount: number,
  availableCount: number,
  isWeekendOrHolidayDay: boolean
): CoverageStatus {
  const dateStr = date.toISOString().slice(0, 10);

  if (isWeekendOrHolidayDay) {
    // REGLA: en fin de semana/festivo solo se exige ≥1MF y ≥1TF
    // El soft target no aplica en fin de semana
    const hardMet = mCount >= 1 && tCount >= 1;
    const warnings: CoverageWarning[] = [];
    if (!hardMet && availableCount > 0) {
      warnings.push({
        date: dateStr,
        employeeId: "",
        message: `Cobertura insuficiente el ${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}: ${mCount}MF + ${tCount}TF (mínimo 1MF + 1TF)`,
      });
    }
    return { hardMet, softMet: true, warnings };
  }

  // REGLA: en día laborable se exige ≥1M + ≥1T (hard) y ≥2M + ≥2T (soft)
  const hardMet = mCount >= 1 && tCount >= 1;
  const softMet = mCount >= 2 && tCount >= 2;
  const warnings: CoverageWarning[] = [];

  if (!hardMet && availableCount > 0) {
    warnings.push({
      date: dateStr,
      employeeId: "",
      message: `Cobertura hard no alcanzada el ${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}: ${mCount}M + ${tCount}T`,
    });
  }

  return { hardMet, softMet, warnings };
}
