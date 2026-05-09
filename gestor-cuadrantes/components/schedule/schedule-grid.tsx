import { ShiftCell } from "@/components/schedule/shift-cell";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import { MockEmployee, MockShiftAssignment } from "@/lib/mock/schedule-data";

interface ScheduleGridProps {
  year: number;
  month: number; // 1-12
  employees: MockEmployee[];
  assignments: MockShiftAssignment[];
}

const DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

// Calcula los contadores de turnos de un empleado en el mes
function computeCounters(
  employeeId: string,
  assignments: MockShiftAssignment[]
): Record<string, number> {
  const counters: Record<string, number> = {};
  assignments
    .filter((a) => a.employeeId === employeeId)
    .forEach((a) => {
      counters[a.shiftType] = (counters[a.shiftType] ?? 0) + 1;
    });
  return counters;
}

export function ScheduleGrid({
  year,
  month,
  employees,
  assignments,
}: ScheduleGridProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Índice rápido: employeeId → date → shiftType
  const index: Record<string, Record<string, ShiftType>> = {};
  assignments.forEach((a) => {
    if (!index[a.employeeId]) index[a.employeeId] = {};
    index[a.employeeId][a.date] = a.shiftType as ShiftType;
  });

  const shiftOrder: ShiftType[] = ["M", "T", "N", "J", "D", "V", "B"];

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="border-collapse text-xs min-w-max">
        <thead>
          {/* Fila de números de día */}
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[140px]">
              Empleado
            </th>
            {days.map((day) => {
              const date = new Date(year, month - 1, day);
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <th
                  key={day}
                  className={`w-9 py-1 text-center border-b border-r border-gray-200 font-medium ${
                    isWeekend ? "bg-blue-50 text-blue-700" : "text-gray-600"
                  }`}
                >
                  <div>{day}</div>
                  <div className="text-[10px] font-normal text-gray-400">
                    {DAY_NAMES[dayOfWeek]}
                  </div>
                </th>
              );
            })}
            <th className="px-2 py-2 text-center font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 min-w-[180px]">
              Contadores
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, rowIndex) => {
            const counters = computeCounters(emp.id, assignments);
            const rowBg = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50";

            return (
              <tr key={emp.id} className={`${rowBg} hover:bg-yellow-50/40 transition-colors`}>
                {/* Nombre del empleado */}
                <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1 font-medium text-gray-700 border-r border-b border-gray-200 whitespace-nowrap`}>
                  {emp.name}
                </td>

                {/* Celdas de turno */}
                {days.map((day) => {
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const shift = index[emp.id]?.[dateStr];
                  const date = new Date(year, month - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <td
                      key={day}
                      className={`w-9 h-8 p-0.5 border-r border-b border-gray-200 ${
                        isWeekend ? "bg-blue-50/30" : ""
                      }`}
                    >
                      {shift ? <ShiftCell shiftType={shift} /> : null}
                    </td>
                  );
                })}

                {/* Fila de contadores */}
                <td className="px-2 py-1 border-b border-gray-200">
                  <div className="flex flex-wrap gap-1">
                    {shiftOrder
                      .filter((s) => (counters[s] ?? 0) > 0)
                      .map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: SHIFT_COLORS[s].color,
                            color: SHIFT_COLORS[s].textColor,
                          }}
                        >
                          {s}:{counters[s]}
                        </span>
                      ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
