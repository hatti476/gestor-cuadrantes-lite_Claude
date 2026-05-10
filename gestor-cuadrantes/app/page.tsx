"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Header } from "@/components/layout/header";
import { ShiftEditor } from "@/components/schedule/shift-editor";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import { ScheduleAssignment, ScheduleEmployee } from "@/lib/schedules/types";
import { useToast } from "@/components/ui/toast-provider";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default function HomePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const router = useRouter();
  const { showToast } = useToast();

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);

  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [holidayDates, setHolidayDates] = useState<Map<string, string>>(new Map());
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
      const [scheduleRes, holidayRes] = await Promise.all([
        fetch(`/api/schedules?year=${year}&month=${month}`),
        fetch(`/api/holidays?year=${year}`),
      ]);
      if (!scheduleRes.ok) throw new Error("Error cargando cuadrante");
      const data: ScheduleAssignment[] = await scheduleRes.json();

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

      // Filtrar festivos del mes actual
      if (holidayRes.ok) {
        const allHolidays: { date: string; description: string }[] = await holidayRes.json();
        const monthStr = String(month).padStart(2, "0");
        const prefix = `${year}-${monthStr}`;
        setHolidayDates(
          new Map(
            allHolidays
              .filter((h) => h.date.slice(0, 10).startsWith(prefix))
              .map((h) => [h.date.slice(0, 10), h.description])
          )
        );
      }
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

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, date, shiftType }),
    });
    if (res.ok) {
      showToast("Turno guardado", "success");
    } else {
      showToast("Error al guardar el turno", "error");
    }
    setEditingCell(null);
    await loadSchedule();
  }

  // ---------------------------------------------------------------------------
  // Eliminar turno desde el editor
  // ---------------------------------------------------------------------------
  async function handleDeleteShift() {
    if (!editingCell?.assignmentId) return;
    const res = await fetch(`/api/schedules?id=${editingCell.assignmentId}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Turno eliminado", "success");
    } else {
      showToast("Error al eliminar el turno", "error");
    }
    setEditingCell(null);
    await loadSchedule();
  }

  // ---------------------------------------------------------------------------
  // Generación automática
  // ---------------------------------------------------------------------------
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/schedules/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      if (!res.ok) throw new Error();
      const { created } = await res.json();
      showToast(`Cuadrante generado — ${created} turnos asignados`, "success");
      await loadSchedule();
    } catch {
      showToast("Error al generar el cuadrante", "error");
    } finally {
      setGenerating(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Exportar CSV
  // ---------------------------------------------------------------------------
  function handleExportCSV() {
    if (employees.length === 0) {
      showToast("No hay datos que exportar", "info");
      return;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Cabecera
    const header = ["Empleado", ...days.map((d) => String(d))].join(",");

    // Filas
    const rows = employees.map((emp) => {
      const cells = days.map((day) => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const a = assignments.find(
          (x) => x.employeeId === emp.id && x.date.slice(0, 10) === dateStr
        );
        return a ? a.shiftType : "";
      });
      return [emp.name, ...cells].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cuadrante-${year}-${String(month).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV exportado", "success");
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
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1 print:hidden">
              Modo edición — clic en celda para asignar turno
            </span>
          )}
          {isAdmin && (
            <button
              data-testid="btn-generate"
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors print:hidden"
            >
              {generating ? "Generando..." : "Generar cuadrante"}
            </button>
          )}
          <button
            data-testid="btn-export-csv"
            onClick={handleExportCSV}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors print:hidden"
          >
            Exportar CSV
          </button>
          <button
            data-testid="btn-print"
            onClick={() => window.print()}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors print:hidden"
          >
            Imprimir
          </button>
          {isAdmin && (
            <button
              data-testid="btn-holidays"
              onClick={() => router.push("/holidays")}
              className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors print:hidden"
            >
              Festivos
            </button>
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
            holidayDates={holidayDates}
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
