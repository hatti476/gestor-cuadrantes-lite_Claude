import { ShiftType } from "@/lib/constants/shift-colors";

export interface MockEmployee {
  id: string;
  name: string;
}

export interface MockShiftAssignment {
  employeeId: string;
  date: string; // ISO date string YYYY-MM-DD
  shiftType: ShiftType;
}

export const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: "1", name: "Administrador" },
  { id: "2", name: "Técnico 1" },
  { id: "3", name: "Técnico 2" },
  { id: "4", name: "Técnico 3" },
  { id: "5", name: "Técnico 4" },
  { id: "6", name: "Técnico 5" },
  { id: "7", name: "Técnico 6" },
  { id: "8", name: "Técnico 7" },
];

// Genera un cuadrante de ejemplo para mayo 2026
// Simula las reglas de negocio: bloques de noche, cobertura M/T, descansos
function generateMockAssignments(): MockShiftAssignment[] {
  const assignments: MockShiftAssignment[] = [];
  const year = 2026;
  const month = 5; // Mayo
  const daysInMonth = 31;

  // Patrones por empleado (simplificado para el mock)
  const patterns: ShiftType[][] = [
    // Admin: jornada normal L-V, descanso finde
    ["J","J","J","J","J","D","D","J","J","J","J","J","D","D","J","J","J","J","J","D","D","J","J","J","J","J","D","D","J","J","J"],
    // Técnico 1: bloque de noches semana 1-2, luego M
    ["D","D","N","N","N","N","N","N","N","D","D","D","M","M","M","M","M","D","D","M","M","M","M","M","D","D","M","M","M","M","M"],
    // Técnico 2: M primera quincena, T segunda
    ["M","M","M","M","M","D","D","M","M","M","M","M","D","D","T","T","T","T","T","D","D","T","T","T","T","T","D","D","T","T","T"],
    // Técnico 3: T primera quincena, M segunda
    ["T","T","T","T","T","D","D","T","T","T","T","T","D","D","M","M","M","M","M","D","D","M","M","M","M","M","D","D","M","M","M"],
    // Técnico 4: bloque de noches semana 2-3
    ["M","M","M","M","M","D","D","D","D","N","N","N","N","N","N","N","D","D","D","M","M","M","M","M","D","D","M","M","M","M","M"],
    // Técnico 5: vacaciones primera semana, luego M
    ["V","V","V","V","V","V","V","M","M","M","M","M","D","D","M","M","M","M","M","D","D","T","T","T","T","T","D","D","T","T","T"],
    // Técnico 6: T todo el mes
    ["T","T","T","T","T","D","D","T","T","T","T","T","D","D","T","T","T","T","T","D","D","T","T","T","T","T","D","D","T","T","T"],
    // Técnico 7: baja primeros días, luego M
    ["B","B","B","B","B","B","B","B","M","M","M","M","D","D","M","M","M","M","M","D","D","M","M","M","M","M","D","D","M","M","M"],
  ];

  MOCK_EMPLOYEES.forEach((emp, empIndex) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const shiftType = patterns[empIndex][day - 1];
      assignments.push({ employeeId: emp.id, date, shiftType });
    }
  });

  return assignments;
}

export const MOCK_ASSIGNMENTS = generateMockAssignments();
