"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Header } from "@/components/layout/header";
import { ShiftEditor } from "@/components/schedule/shift-editor";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import { ScheduleAssignment, ScheduleEmployee } from "@/lib/schedules/types";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default function HomePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);

  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor de turno
  const [editingCell, setEditingCell] = useState<{
    employeeId: string;
    date: string;
    currentShift?: string;
    assignmentId?: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Carga datos del mes
  // ---------------------------------------------------------------------------
  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedules?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Error cargando cuadrante");
      const data: ScheduleAssignment[] = await res.json();

      // Extraer empleados únicos ordenados por rotationOrder
      const empMap = new Map<string, ScheduleEmployee>();
      data.forEach((a) => {
        if (a.employee && !empMap.has(a.employeeId)) {
          empMap.set(a.employeeId, a.employee);
        }
      });
      const sortedEmployees = Array.from(empMap.values()).sort(
        (a, b) => a.rotationOrder - b.rotationOrder
      );

      setEmployees(sortedEmployees);
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // ---------------------------------------------------------------------------
  // Navegación de mes
  // ---------------------------------------------------------------------------
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // ---------------------------------------------------------------------------
  // Clic en celda (solo ADMIN)
  // ---------------------------------------------------------------------------
  function handleCellClick(employeeId: string, date: string, currentShift?: string) {
    const found = assignments.find(
      (a) => a.employeeId === employeeId && a.date.slice(0, 10) === date
    );
    setEditingCell({ employeeId, date, currentShift, assignmentId: found?.id });
  }

  // ---------------------------------------------------------------------------
  // Guardar turno desde el editor
  // ---------------------------------------------------------------------------
  async function handleSaveShift(shiftType: string) {
    if (!editingCell) return;
    const { employeeId, date } = editingCell;

    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, date, shiftType }),
    });
    setEditingCell(null);
    await loadSchedule();
  }

  // ---------------------------------------------------------------------------
  // Eliminar turno desde el editor
  // ---------------------------------------------------------------------------
  async function handleDeleteShift() {
    if (!editingCell?.assignmentId) return;
    await fetch(`/api/schedules?id=${editingCell.assignmentId}`, { method: "DELETE" });
    setEditingCell(null);
    await loadSchedule();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        {/* Navegación de mes */}
        <div className="flex items-center gap-4 mb-6">
          <button
            data-testid="btn-prev-month"
            onClick={prevMonth}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-lg"
          >
            ‹
          </button>
          <h2 className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button
            data-testid="btn-next-month"
            onClick={nextMonth}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-lg"
          >
            ›
          </button>
          {isAdmin && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1">
              Modo edición — clic en celda para asignar turno
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Cargando cuadrante...
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <span className="text-4xl">📋</span>
            <p className="text-sm">Sin turnos asignados este mes</p>
          </div>
        ) : (
          <ScheduleGrid
            year={year}
            month={month}
            employees={employees}
            assignments={assignments}
            onCellClick={isAdmin ? handleCellClick : undefined}
          />
        )}

        {/* Leyenda */}
        <div className="mt-6 flex flex-wrap gap-3">
          {(["M","T","N","J","D","V","B"] as ShiftType[]).map((shift) => {
            const { color, textColor, label } = SHIFT_COLORS[shift];
            return (
              <div key={shift} className="flex items-center gap-1.5 text-sm">
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: color, color: textColor }}
                >
                  {shift}
                </span>
                <span className="text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal editor de turno */}
      {editingCell && (
        <ShiftEditor
          date={editingCell.date}
          currentShift={editingCell.currentShift}
          onSave={handleSaveShift}
          onDelete={editingCell.assignmentId ? handleDeleteShift : undefined}
          onClose={() => setEditingCell(null)}
        />
      )}
    </div>
  );
}
