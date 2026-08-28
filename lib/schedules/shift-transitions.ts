/**
 * @module shift-transitions
 * @description Validación de transiciones entre turnos según ET Art.34.3.
 *              Garantiza un mínimo de 12h de descanso entre turnos consecutivos.
 * @dependencies business-logic (isValidShiftType, validateShiftTransition)
 */

export type { ValidShiftType } from "./business-logic";
export {
  isValidShiftType,
  validateShiftTransition,
} from "./business-logic";

/**
 * Hora de inicio de cada tipo de turno (relativa al inicio del día siguiente,
 * en horas desde medianoche del día anterior, para comparaciones de gap).
 * Usado únicamente como referencia documental — el cálculo real está en
 * business-logic.ts (validateShiftTransition).
 *
 * REGLA ET Art.34.3: mínimo 12h entre fin de un turno e inicio del siguiente.
 * Transiciones prohibidas:
 *   T  → M  (gap 8h)
 *   N  → M  (gap 0h — la N termina a las 7h cuando M empieza)
 *   N  → T  (gap 8h)
 */
export const SHIFT_START_HOUR: Record<string, number> = {
  M:  7,   // 07:00
  T:  15,  // 15:00
  N:  23,  // 23:00 (empieza el día)
  MF: 7,
  TF: 15,
  NF: 23,
  MN: 7,
  TN: 15,
  NN: 23,
};

export const SHIFT_END_HOUR: Record<string, number> = {
  M:  15,  // 15:00
  T:  23,  // 23:00
  N:  7,   // 07:00 del día siguiente
  MF: 15,
  TF: 23,
  NF: 7,
  MN: 15,
  TN: 23,
  NN: 7,
};
