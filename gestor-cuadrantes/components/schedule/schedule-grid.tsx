"use client";
import { useState, useEffect, useRef } from "react";
import { ShiftCell } from "@/components/schedule/shift-cell";
import { ShiftType } from "@/lib/constants/shift-colors";
import { ScheduleEmployee, ScheduleAssignment } from "@/lib/schedules/types";


interface ScheduleGridProps {
  year: number;
  month: number; // 1-12
  employees: ScheduleEmployee[];
  assignments: ScheduleAssignment[];
  /** Días festivos del mes: mapa de "YYYY-MM-DD" → descripción */
  holidayDates?: Map<string, string>;
  /** Si se provee, las celdas son clicables (modo edición ADMIN) */
  onCellClick?: (employeeId: string, date: string, currentShift?: string) => void;
  /** Celdas bloqueadas por preparación manual: Set de "employeeId|YYYY-MM-DD" */
  lockedCells?: Set<string>;
  /** Permite clicks sobre celdas bloqueadas en flujos controlados como PrepPanel */
  allowLockedCellClick?: boolean;
  /** User.id del usuario autenticado — resalta su fila en el grid */
  currentUserId?: string | null;
}

const DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

export function ScheduleGrid({
  year,
  month,
  employees,
  assignments,
  holidayDates = new Map(),
  onCellClick,
  lockedCells = new Set(),
  allowLockedCellClick = false,
  currentUserId,
}: ScheduleGridProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Popover de festivo: qué día está abierto y en qué posición
  const [popup, setPopup] = useState<{ dateStr: string; x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!popup) return;
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popup]);

  // Índice rápido: employeeId → dateStr → { id, shiftType }
  const index: Record<string, Record<string, { id: string; shiftType: ShiftType }>> = {};
  assignments.forEach((a) => {
    if (!index[a.employeeId]) index[a.employeeId] = {};
    // Normalizar fecha a YYYY-MM-DD
    const dateStr = a.date.slice(0, 10);
    index[a.employeeId][dateStr] = { id: a.id, shiftType: a.shiftType as ShiftType };
  });

  return (
    <>
      <div data-testid="schedule-grid" className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table
        className="border-collapse text-xs w-full"
        style={{ tableLayout: "fixed", minWidth: `${150 + daysInMonth * 26}px` }}
      >
        <colgroup>
          <col style={{ width: "150px" }} />
          {days.map((day) => <col key={day} />)}
        </colgroup>
        <thead>
          {/* Fila de números de día */}
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
              Empleado
            </th>
            {days.map((day) => {
              const date = new Date(year, month - 1, day);
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isHoliday = holidayDates.has(dateStr);
              return (
                <th
                  key={day}
                  onClick={isHoliday ? (e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPopup(popup?.dateStr === dateStr ? null : {
                      dateStr,
                      x: rect.left + rect.width / 2,
                      y: rect.bottom + window.scrollY,
                    });
                  } : undefined}
                  className={`py-1 text-center border-b border-r border-gray-200 font-medium ${
                    isHoliday
                      ? "bg-red-200 text-red-800 cursor-pointer select-none"
                      : isWeekend
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-600"
                  }`}
                >
                  <div>{day}</div>
                  <div className="text-[10px] font-normal text-gray-400">
                    {DAY_NAMES[dayOfWeek]}
                  </div>
                </th>
              );
            })}

          </tr>
        </thead>
        <tbody>
          {employees.map((emp, rowIndex) => {
            const isOwnRow = !!currentUserId && emp.userId === currentUserId;
            const rowBg = isOwnRow
              ? "bg-indigo-50"
              : rowIndex % 2 === 0
              ? "bg-white"
              : "bg-gray-50/50";

            return (
              <tr
                key={emp.id}
                data-testid={isOwnRow ? "own-row" : undefined}
                className={`${rowBg} hover:bg-yellow-50/40 transition-colors ${
                  isOwnRow ? "ring-2 ring-inset ring-indigo-300" : ""
                }`}
              >
                {/* Nombre del empleado */}
                <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1 font-medium border-r border-b border-gray-200 truncate ${
                  isOwnRow ? "text-indigo-700 font-semibold" : "text-gray-700"
                }`}>
                  {isOwnRow && (
                    <span className="inline-block mr-1 text-indigo-400" aria-label="Tu fila">▶</span>
                  )}
                  {emp.name}
                </td>

                {/* Celdas de turno */}
                {days.map((day) => {
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const cell = index[emp.id]?.[dateStr];
                  const date = new Date(year, month - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isHolidayCell = holidayDates.has(dateStr);
                  const isLocked = lockedCells.has(`${emp.id}|${dateStr}`);
                  const clickable = !!onCellClick && (!isLocked || allowLockedCellClick);

                  return (
                    <td
                      key={day}
                      data-testid={`cell-${emp.id}-${dateStr}`}
                      onClick={clickable ? () => onCellClick(emp.id, dateStr, cell?.shiftType) : undefined}
                      data-locked={isLocked ? "true" : undefined}
                      className={`h-8 p-0.5 border-r border-b border-gray-200 relative ${
                        isHolidayCell ? "bg-red-50" : isWeekend ? "bg-blue-50" : ""
                      } ${clickable ? "cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset" : ""} ${
                        isLocked ? "ring-2 ring-inset ring-dashed ring-amber-400" : ""
                      }`}
                    >
                      {cell ? <ShiftCell shiftType={cell.shiftType} /> : null}
                      {isLocked && (
                        <span className="absolute top-0 right-0 text-[8px] leading-none text-amber-500 pointer-events-none">🔒</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Popover de info de festivo */}
      {popup && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white border border-red-200 shadow-lg rounded-lg px-3 py-2 text-xs text-red-800 max-w-[200px] text-center pointer-events-auto"
          style={{
            left: popup.x,
            top: popup.y + 6,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold mb-0.5">🎉 Festivo</div>
          <div>{holidayDates.get(popup.dateStr)}</div>
        </div>
      )}
    </>
  );
}
