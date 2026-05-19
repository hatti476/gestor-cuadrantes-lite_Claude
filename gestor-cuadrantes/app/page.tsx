"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Header } from "@/components/layout/header";
import { ShiftEditor } from "@/components/schedule/shift-editor";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import { ScheduleAssignment, ScheduleEmployee, MonthStatus, computeMonthStatus } from "@/lib/schedules/types";
import { countShifts } from "@/lib/schedules/business-logic";
import { PrepPanel, MonthStatusBadge, PrepStep } from "@/components/schedule/prep-panel";
import { useToast } from "@/components/ui/toast-provider";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const COUNTER_SHIFTS: ShiftType[] = ["M", "T", "N", "MF", "TF", "NF", "J", "D", "V", "B"];

function CountersTable({
  employees,
  assignments,
}: {
  employees: ScheduleEmployee[];
  assignments: ScheduleAssignment[];
}) {
  return (
    <div className="mt-2 w-fit overflow-x-auto rounded-lg border border-gray-200 shadow-sm" data-testid="counters-table">
      <table className="border-collapse text-xs min-w-max">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[140px]">
              Empleado
            </th>
            {COUNTER_SHIFTS.map((s) => (
              <th
                key={s}
                className="w-9 py-1 text-center border-b border-r border-gray-200"
              >
                <div
                  className="flex items-center justify-center w-7 h-7 mx-auto rounded-sm text-xs font-bold select-none"
                  style={{ backgroundColor: SHIFT_COLORS[s].color, color: SHIFT_COLORS[s].textColor }}
                >
                  {s}
                </div>
              </th>
            ))}
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
                <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1 font-medium text-gray-700 border-r border-b border-gray-200 whitespace-nowrap`}>
                  {emp.name}
                </td>
                {COUNTER_SHIFTS.map((s) => {
                  const count = counters[s] ?? 0;
                  return (
                    <td
                      key={s}
                      className="w-9 h-8 py-1 text-center border-r border-b border-gray-200 font-mono tabular-nums"
                      style={{ color: count === 0 ? "#9E9E9E" : undefined }}
                      data-testid={`counter-${emp.id}-${s}`}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPER_ADMIN";
  const router = useRouter();
  const { showToast } = useToast();

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("activeProject");
      return stored ? (JSON.parse(stored) as { id: string; name: string }).id : null;
    } catch {
      return null;
    }
  });

  const [activeProjectRegion, setActiveProjectRegion] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("activeProject");
      return stored ? ((JSON.parse(stored) as { region?: string | null }).region ?? null) : null;
    } catch {
      return null;
    }
  });

  // PROJECT_ADMIN también puede editar celdas de su proyecto
  const canEdit = isAdmin || (session?.user?.projectMemberships ?? []).some(
    (m: { projectId: string; role: string }) =>
      m.projectId === activeProjectId && m.role === "PROJECT_ADMIN"
  );

  // Validar proyecto activo contra la API y auto-seleccionar el primero si no hay ninguno válido
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((projects: { id: string; name: string; region?: string | null }[]) => {
        if (projects.length === 0) {
          // No hay proyectos: limpiar selección obsoleta de localStorage
          localStorage.removeItem("activeProject");
          setActiveProjectId(null);
          setActiveProjectRegion(null);
          return;
        }
        // Comprobar si el proyecto guardado sigue existiendo
        const stored = projects.find((p) => p.id === activeProjectId);
        if (stored) return; // sigue siendo válido, no hacer nada

        // El proyecto guardado ya no existe → seleccionar el primero disponible
        const { id, name, region } = projects[0];
        localStorage.setItem("activeProject", JSON.stringify({ id, name, region: region ?? null }));
        window.dispatchEvent(new Event("activeProjectChanged"));
        setActiveProjectId(id);
        setActiveProjectRegion(region ?? null);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // Sincronizar región cuando cambie el proyecto activo desde otra ventana/tab
  useEffect(() => {
    function onProjectChanged() {
      try {
        const stored = localStorage.getItem("activeProject");
        if (stored) {
          const parsed = JSON.parse(stored) as { id: string; region?: string | null };
          setActiveProjectId(parsed.id ?? null);
          setActiveProjectRegion(parsed.region ?? null);
        }
      } catch {}
    }
    window.addEventListener("activeProjectChanged", onProjectChanged);
    return () => window.removeEventListener("activeProjectChanged", onProjectChanged);
  }, []);

  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [holidayDates, setHolidayDates] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [monthStatus, setMonthStatus] = useState<MonthStatus>("ungenerated");

  // Estado del panel de preparación
  const [prepStep, setPrepStep] = useState<PrepStep>(null);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
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
      const projectParam = activeProjectId ? `&projectId=${activeProjectId}` : "";
      const employeeParam = activeProjectId ? `?projectId=${activeProjectId}` : "";
      const [scheduleRes, holidayRes, employeeRes] = await Promise.all([
        fetch(`/api/schedules?year=${year}&month=${month}${projectParam}`),
        fetch(`/api/holidays?year=${year}`),
        fetch(`/api/employees${employeeParam}`),
      ]);
      if (!scheduleRes.ok) throw new Error("Error cargando cuadrante");
      const responseData: { assignments: ScheduleAssignment[]; monthStatus: MonthStatus } = await scheduleRes.json();
      const data = responseData.assignments ?? [];

      // Cargar empleados desde la API (independientemente de si hay turnos)
      let sortedEmployees: ScheduleEmployee[] = [];
      if (employeeRes.ok) {
        const apiEmployees: (ScheduleEmployee & { userId?: string })[] = await employeeRes.json();
        sortedEmployees = apiEmployees
          .sort((a, b) => a.rotationOrder - b.rotationOrder)
          .map((e) => ({ ...e, userId: e.userId ?? null }));
      } else {
        // Fallback: extraer de asignaciones si la API falla
        const empMap = new Map<string, ScheduleEmployee>();
        data.forEach((a) => {
          if (a.employee && !empMap.has(a.employeeId)) {
            empMap.set(a.employeeId, a.employee);
          }
        });
        sortedEmployees = Array.from(empMap.values()).sort(
          (a, b) => a.rotationOrder - b.rotationOrder
        );
      }

      setEmployees(sortedEmployees);
      setAssignments(data);
      setMonthStatus(responseData.monthStatus ?? computeMonthStatus(data));

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
  }, [year, month, activeProjectId]);

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
  // Clic en celda — normal o en modo prep
  // ---------------------------------------------------------------------------
  async function handleCellClick(employeeId: string, date: string, currentShift?: string) {
    // Modo preparación: asigna directamente V o D sin abrir el modal
    if (prepStep === "vacaciones" || prepStep === "libres") {
      const shiftType = prepStep === "vacaciones" ? "V" : "D";
      // Toggle: si ya tiene ese tipo, limpiarlo
      const found = assignments.find(
        (a) => a.employeeId === employeeId && a.date.slice(0, 10) === date
      );
      if (found?.shiftType === shiftType) {
        // Quitar la asignación
        if (found.id) {
          await fetch(`/api/schedules?id=${found.id}`, { method: "DELETE" });
        }
      } else {
        await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, date, shiftType }),
        });
      }
      await loadSchedule();
      return;
    }
    // Modo normal: abrir editor modal
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
  // Generación automática (con confirmación si ya hay datos)
  // ---------------------------------------------------------------------------
  const [generating, setGenerating] = useState(false);

  function requestGenerate() {
    if (monthStatus === "generated") {
      setShowConfirmGenerate(true);
    } else {
      void doGenerate();
    }
  }

  async function doGenerate() {
    setShowConfirmGenerate(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/schedules/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, projectId: activeProjectId }),
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

  // Guardar preparación (marca el badge como "En preparación")
  function handleSavePreparation() {
    showToast("Preparación guardada", "success");
    // El estado ya refleja la preparación porque las celdas V/D existen en BD
    // Solo necesitamos recargar para asegurar el badge correcto
    void loadSchedule();
  }

  // Cargar festivos automáticamente desde la API pública (nager.at) filtrada por CCAA
  async function handleAutoLoadHolidays() {
    if (!activeProjectRegion) return;
    setLoadingHolidays(true);
    try {
      const res = await fetch(
        `/api/holidays/public?year=${year}&region=${encodeURIComponent(activeProjectRegion)}`
      );
      if (!res.ok) {
        showToast("No se pudieron cargar los festivos. Puedes añadirlos manualmente.", "error");
        return;
      }
      const publicHolidays: { date: string; description: string }[] = await res.json();

      // Filtrar solo los del mes actual
      const monthStr = String(month).padStart(2, "0");
      const monthHolidays = publicHolidays.filter((h) =>
        h.date.startsWith(`${year}-${monthStr}`)
      );

      if (monthHolidays.length === 0) {
        showToast("No hay festivos públicos este mes para la región seleccionada.", "info");
        return;
      }

      // Añadir los festivos a la BD (POST /api/holidays), ignorar duplicados (409)
      let added = 0;
      for (const h of monthHolidays) {
        const postRes = await fetch("/api/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: h.date, description: h.description }),
        });
        if (postRes.ok) added++;
        // 409 = ya existe, se ignora silenciosamente
      }

      if (added > 0) {
        showToast(`${added} festivo${added > 1 ? "s" : ""} añadido${added > 1 ? "s" : ""} correctamente`, "success");
        await loadSchedule(); // refresca contadores y holidayDates
      } else {
        showToast("Los festivos de este mes ya estaban registrados.", "info");
      }
    } catch {
      showToast("No se pudieron cargar los festivos. Puedes añadirlos manualmente.", "error");
    } finally {
      setLoadingHolidays(false);
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
  // Render helpers
  // ---------------------------------------------------------------------------
  // Celdas bloqueadas por preparación manual (V manual o D manual)
  const lockedCells = new Set<string>(
    assignments
      .filter((a) => (a.shiftType === "V" || (a.shiftType === "D" && a.manual)))
      .map((a) => `${a.employeeId}|${a.date.slice(0, 10)}`)
  );
  const vacacionesCount = assignments.filter((a) => a.shiftType === "V").length;
  const libresCount = assignments.filter((a) => a.shiftType === "D" && a.manual).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        {/* Navegación de mes */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
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
          {/* Badge de estado del mes */}
          {!loading && <MonthStatusBadge status={monthStatus} />}
          {canEdit && prepStep && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1 print:hidden">
              Modo preparación — clic en celda para asignar {prepStep === "vacaciones" ? "V" : "D"}
            </span>
          )}
          {canEdit && !prepStep && (
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1 print:hidden">
              Modo edición — clic en celda para asignar turno
            </span>
          )}
          <button
            data-testid="btn-export-csv"
            onClick={handleExportCSV}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors print:hidden"
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

        {/* Contenido principal: grid + panel de preparación */}
        <div className="flex gap-6 items-start">
          {/* Grid + contadores */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Cargando cuadrante...
              </div>
            ) : (
              <>
                <ScheduleGrid
                  year={year}
                  month={month}
                  employees={employees}
                  assignments={assignments}
                  holidayDates={holidayDates}
                  onCellClick={canEdit ? handleCellClick : undefined}
                  lockedCells={lockedCells}
                  currentUserId={session?.user?.id ?? null}
                />
                {employees.length > 0 && (
                  <CountersTable employees={employees} assignments={assignments} />
                )}
                {employees.length === 0 && monthStatus === "ungenerated" && (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2 mt-4">
                    <span className="text-4xl">📋</span>
                    <p className="text-sm">Sin turnos asignados este mes. Usa el panel para preparar y generar.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel de preparación (solo admins) */}
          {isAdmin && !loading && (
            <div className="w-56 flex-shrink-0 print:hidden">
              <PrepPanel
                monthStatus={monthStatus}
                activeStep={prepStep}
                onStepChange={setPrepStep}
                vacacionesCount={vacacionesCount}
                libresCount={libresCount}
                holidaysCount={holidayDates.size}
                onSavePreparation={handleSavePreparation}
                onGenerate={requestGenerate}
                generating={generating}
                isAdmin={isAdmin}
                onManageHolidays={() => router.push("/holidays")}
                projectRegion={activeProjectRegion}
                projectId={activeProjectId}
                onAutoLoadHolidays={handleAutoLoadHolidays}
                loadingHolidays={loadingHolidays}
              />
            </div>
          )}
        </div>

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

      {/* Modal de confirmación de generación */}
      {showConfirmGenerate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="confirm-generate-modal">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Regenerar cuadrante?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Esto sobreescribirá las celdas no bloqueadas del mes. Las vacaciones, bajas y días libres marcados se conservarán. ¿Continuar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                data-testid="btn-cancel-generate"
                onClick={() => setShowConfirmGenerate(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                data-testid="btn-confirm-generate"
                onClick={() => void doGenerate()}
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Generar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
