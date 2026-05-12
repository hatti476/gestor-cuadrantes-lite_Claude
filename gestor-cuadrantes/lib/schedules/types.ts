/** Tipos compartidos para el cuadrante — usados por API, componentes y hooks */

export interface ScheduleEmployee {
  id: string;
  name: string;
  rotationOrder: number;
  shiftPreference?: string | null;
}

export interface ScheduleAssignment {
  id: string;
  employeeId: string;
  /** Fecha ISO string "YYYY-MM-DD" */
  date: string;
  shiftType: string;
  employee?: ScheduleEmployee;
}
