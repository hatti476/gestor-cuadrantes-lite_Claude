import { ShiftCell } from "@/components/schedule/shift-cell";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import { ScheduleEmployee, ScheduleAssignment } from "@/lib/schedules/types";
import { countShifts } from "@/lib/schedules/business-logic";

interface ScheduleGridProps {
  year: number;
  month: number; // 1-12
  employees: ScheduleEmployee[];
  assignments: ScheduleAssignment[];
  /** Si se provee, las celdas son clicables (modo edición ADMIN) */
  onCellClick?: (employeeId: string, date: string, currentShift?: string) => void;
}

const DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

export function ScheduleGrid({
  year,
  month,
  employees,
  assignments,
  onCellClick,
}: ScheduleGridProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Índice rápido: employeeId → dateStr → { id, shiftType }
  const index: Record<string, Record<string, { id: string; shiftType: ShiftType }>> = {};
  assignments.forEach((a) => {
    if (!index[a.employeeId]) index[a.employeeId] = {};
    // Normalizar fecha a YYYY-MM-DD
    const dateStr = a.date.slice(0, 10);
    index[a.employeeId][dateStr] = { id: a.id, shiftType: a.shiftType as ShiftType };
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
            const empShifts = assignments
              .filter((a) => a.employeeId === emp.id)
              .map((a) => a.shiftType);
            const counters = countShifts(empShifts);
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
                  const cell = index[emp.id]?.[dateStr];
                  const date = new Date(year, month - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const clickable = !!onCellClick;

                  return (
                    <td
                      key={day}
                      onClick={clickable ? () => onCellClick(emp.id, dateStr, cell?.shiftType) : undefined}
                      className={`w-9 h-8 p-0.5 border-r border-b border-gray-200 ${
                        isWeekend ? "bg-blue-50/30" : ""
                      } ${clickable ? "cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset" : ""}`}
                    >
                      {cell ? <ShiftCell shiftType={cell.shiftType} /> : null}
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
