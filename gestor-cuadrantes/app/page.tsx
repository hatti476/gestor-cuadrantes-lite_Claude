"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Header } from "@/components/layout/header";
import { ShiftEditor } from "@/components/schedule/shift-editor";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import { ScheduleAssignment, ScheduleEmployee, MonthStatus, computeMonthStatus } from "@/lib/schedules/types";
import {
  EXTRA_PAY_RATES,
  calculateExtraPay,
  countShifts,
  isValidShiftType,
  validateShiftTransition,
} from "@/lib/schedules/business-logic";
import { PrepPanel, MonthStatusBadge, PrepStep } from "@/components/schedule/prep-panel";
import { useToast } from "@/components/ui/toast-provider";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const BASE_COUNTER_SHIFTS: ShiftType[] = ["M", "T", "N", "MF", "TF", "NF", "J", "D", "V", "B"];
const BASE_EXTRA_PAY_SHIFTS: ShiftType[] = ["MF", "TF", "N", "NF"];
const CHRISTMAS_EXTRA_PAY_SHIFTS: ShiftType[] = ["MN", "TN", "NN"];

function addDaysToDateString(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function formatEuro(amount: number): string {
  return `${amount.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function CountersTable({
  employees,
  assignments,
  month,
}: {
  employees: ScheduleEmployee[];
  assignments: ScheduleAssignment[];
  month: number;
}) {
  const counterShifts = month === 12 || month === 1
    ? [...BASE_COUNTER_SHIFTS.slice(0, 6), ...CHRISTMAS_EXTRA_PAY_SHIFTS, ...BASE_COUNTER_SHIFTS.slice(6)]
    : BASE_COUNTER_SHIFTS;

  return (
    <div className="mt-2 w-fit overflow-x-auto rounded-lg border border-gray-200 shadow-sm" data-testid="counters-table">
      <table className="border-collapse text-xs min-w-max">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[140px]">
              Empleado
            </th>
            {counterShifts.map((s) => (
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
                {counterShifts.map((s) => {
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

function ExtraPayTable({
  employees,
  assignments,
  month,
}: {
  employees: ScheduleEmployee[];
  assignments: ScheduleAssignment[];
  month: number;
}) {
  const extraPayShifts = month === 12 || month === 1
    ? [...BASE_EXTRA_PAY_SHIFTS, ...CHRISTMAS_EXTRA_PAY_SHIFTS]
    : BASE_EXTRA_PAY_SHIFTS;
  const rows = employees.map((emp) => {
    const empShifts = assignments
      .filter((a) => a.employeeId === emp.id)
      .map((a) => a.shiftType);
    const counters = countShifts(empShifts);
    return {
      employee: emp,
      counters,
      amount: calculateExtraPay(counters),
    };
  });
  const totalAmount = rows.reduce((total, row) => total + row.amount, 0);

  return (
    <div className="mt-2 flex w-fit items-start gap-3" data-testid="extra-pay-table">
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="border-collapse text-xs min-w-max">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[140px]">
                Empleado
              </th>
              {extraPayShifts.map((shift) => (
                <th
                  key={shift}
                  className="w-9 py-1 text-center border-b border-r border-gray-200"
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 mx-auto rounded-sm text-xs font-bold select-none"
                    style={{ backgroundColor: SHIFT_COLORS[shift].color, color: SHIFT_COLORS[shift].textColor }}
                  >
                    {shift}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[96px]">
                P. Extra
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ employee, counters, amount }, rowIndex) => {
              const rowBg = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50";

              return (
                <tr key={employee.id} className={`${rowBg} hover:bg-yellow-50/40 transition-colors`}>
                  <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1 font-medium text-gray-700 border-r border-b border-gray-200 whitespace-nowrap`}>
                    {employee.name}
                  </td>
                  {extraPayShifts.map((shift) => {
                    const count = counters[shift] ?? 0;
                    return (
                      <td
                        key={shift}
                        className="w-9 h-8 py-1 text-center border-r border-b border-gray-200 font-mono tabular-nums"
                        style={{ color: count === 0 ? "#9E9E9E" : undefined }}
                      >
                        {count}
                      </td>
                    );
                  })}
                  <td
                    className="h-8 px-3 py-1 text-right border-r border-b border-gray-200 font-mono tabular-nums font-semibold text-gray-700"
                    data-testid={`extra-pay-${employee.id}-total`}
                  >
                    {formatEuro(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold text-gray-700">
              <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2 border-r border-gray-200 whitespace-nowrap">
                TOTAL
              </td>
              {extraPayShifts.map((shift) => (
                <td key={shift} className="w-9 border-r border-gray-200" />
              ))}
              <td className="px-3 py-2 text-right border-r border-gray-200 font-mono tabular-nums">
                {formatEuro(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm"
        data-testid="extra-pay-legend"
      >
        <div className="mb-1 font-semibold text-gray-700">Paga/turno</div>
        <div className="space-y-1">
          {extraPayShifts.map((shift) => (
            <div key={shift} className="flex items-center justify-between gap-3 whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                <span
                  className="flex h-5 w-7 items-center justify-center rounded-sm text-[10px] font-bold"
                  style={{ backgroundColor: SHIFT_COLORS[shift].color, color: SHIFT_COLORS[shift].textColor }}
                >
                  {shift}
                </span>
                <span>{SHIFT_COLORS[shift].label}</span>
              </span>
              <span className="font-mono tabular-nums text-gray-800">
                {formatEuro(EXTRA_PAY_RATES[shift] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
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
  const [projectSelectionReady, setProjectSelectionReady] = useState(false);

  // PROJECT_ADMIN también puede editar celdas de su proyecto
  const canEdit = isAdmin || (session?.user?.projectMemberships ?? []).some(
    (m: { projectId: string; role: string }) =>
      m.projectId === activeProjectId && m.role === "PROJECT_ADMIN"
  );

  // Validar proyecto activo contra la API y auto-seleccionar el primero si no hay ninguno válido
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;

    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((projects: { id: string; name: string; region?: string | null }[]) => {
        if (cancelled) return;
        if (projects.length === 0) {
          // No hay proyectos: limpiar selección obsoleta de localStorage
          localStorage.removeItem("activeProject");
          setActiveProjectId(null);
          setActiveProjectRegion(null);
          setProjectSelectionReady(true);
          return;
        }
        // Comprobar si el proyecto guardado sigue existiendo
        const stored = projects.find((p) => p.id === activeProjectId);
        if (stored) {
          setActiveProjectRegion(stored.region ?? null);
          setProjectSelectionReady(true);
          return; // sigue siendo válido, no hacer nada
        }

        // El proyecto guardado ya no existe → seleccionar el primero disponible
        const { id, name, region } = projects[0];
        localStorage.setItem("activeProject", JSON.stringify({ id, name, region: region ?? null }));
        window.dispatchEvent(new Event("activeProjectChanged"));
        setActiveProjectId(id);
        setActiveProjectRegion(region ?? null);
        setProjectSelectionReady(true);
      })
      .catch(() => {
        if (!cancelled) setProjectSelectionReady(true);
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]); // Al iniciar sesión

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
  const autoHolidayLoadKeysRef = useRef<Set<string>>(new Set());
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
    if (!session?.user || !projectSelectionReady) return;
    void Promise.resolve().then(loadSchedule);
  }, [loadSchedule, projectSelectionReady, session?.user]);

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
    // Modo preparación: asigna directamente V, D o B sin abrir el modal
    if (prepStep === "vacaciones" || prepStep === "libres" || prepStep === "bajas") {
      const prepConfig = {
        vacaciones: {
          shiftType: "V",
          label: "Vacaciones",
          marked: "Vacaciones marcadas",
          removed: "Vacaciones eliminadas",
          confirm: "Esta celda tiene un turno asignado. ¿Sustituirlo por vacaciones?",
        },
        libres: {
          shiftType: "D",
          label: "Día libre",
          marked: "Día libre marcado",
          removed: "Día libre eliminado",
          confirm: "Esta celda tiene un turno asignado. ¿Sustituirlo por día libre?",
        },
        bajas: {
          shiftType: "B",
          label: "Baja",
          marked: "Baja marcada",
          removed: "Baja eliminada",
          confirm: "Esta celda tiene un turno asignado. ¿Sustituirlo por baja?",
        },
      }[prepStep];
      const shiftType = prepConfig.shiftType;
      const found = assignments.find(
        (a) => a.employeeId === employeeId && a.date.slice(0, 10) === date
      );

      const isManualFreeDay = found?.shiftType === "D" && found.manual;
      const shouldToggleOff =
        (shiftType === "V" && found?.shiftType === "V") ||
        (shiftType === "D" && isManualFreeDay) ||
        (shiftType === "B" && found?.shiftType === "B");

      if (shouldToggleOff) {
        const res = await fetch(`/api/schedules?id=${found.id}`, { method: "DELETE" });
        showToast(
          res.ok ? prepConfig.removed : "Error al eliminar la celda",
          res.ok ? "success" : "error"
        );
        await loadSchedule();
        return;
      }

      if (found) {
        const confirmed = window.confirm(prepConfig.confirm);
        if (!confirmed) {
          return;
        }
      }

      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, date, shiftType }),
      });
      showToast(
        res.ok ? prepConfig.marked : "Error al preparar la celda",
        res.ok ? "success" : "error"
      );
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

  function getAssignmentShift(employeeId: string, date: string): string | null {
    return assignments.find(
      (a) => a.employeeId === employeeId && a.date.slice(0, 10) === date
    )?.shiftType ?? null;
  }

  function getTransitionWarning(shiftType: string): string | null {
    if (!editingCell || !isValidShiftType(shiftType)) return null;
    const previousShift = getAssignmentShift(
      editingCell.employeeId,
      addDaysToDateString(editingCell.date, -1)
    );
    const nextShift = getAssignmentShift(
      editingCell.employeeId,
      addDaysToDateString(editingCell.date, 1)
    );

    if (previousShift && isValidShiftType(previousShift)) {
      const previousTransition = validateShiftTransition(previousShift, shiftType);
      if (!previousTransition.valid) {
        return "⚠️ Este turno deja menos de 12h de descanso respecto al turno del día anterior. ¿Continuar?";
      }
    }

    if (nextShift && isValidShiftType(nextShift)) {
      const nextTransition = validateShiftTransition(shiftType, nextShift);
      if (!nextTransition.valid) {
        return "⚠️ Este turno deja menos de 12h de descanso respecto al turno del día siguiente. ¿Continuar?";
      }
    }

    return null;
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
      const { created, warnings } = await res.json() as {
        created: number;
        warnings?: { employeeId: string; date: string; prevShift: string; nextShift: string; hoursGap: number }[];
      };
      showToast(`Cuadrante generado — ${created} turnos asignados`, "success");
      if (warnings && warnings.length > 0) {
        showToast(
          `${warnings.length} turnos ajustados por cumplimiento del Estatuto de los Trabajadores`,
          "info"
        );
      }
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
    // El estado ya refleja la preparación porque las celdas V/D/B existen en BD
    // Solo necesitamos recargar para asegurar el badge correcto
    void loadSchedule();
  }

  // Precargar festivos desde la API pública (nager.at) filtrada por CCAA
  const handleAutoLoadHolidays = useCallback(async (options?: { quietInfo?: boolean }) => {
    if (!activeProjectRegion) return;
    const quietInfo = options?.quietInfo ?? false;
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
        if (!quietInfo) showToast("No hay festivos públicos este mes para la región seleccionada.", "info");
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
        showToast(`${added} festivo${added > 1 ? "s" : ""} añadido${added > 1 ? "s" : ""} automáticamente`, "success");
        await loadSchedule(); // refresca contadores y holidayDates
      } else {
        if (!quietInfo) showToast("Los festivos de este mes ya estaban registrados.", "info");
      }
    } catch {
      showToast("No se pudieron cargar los festivos. Puedes añadirlos manualmente.", "error");
    } finally {
      setLoadingHolidays(false);
    }
  }, [activeProjectRegion, year, month, showToast, loadSchedule]);

  useEffect(() => {
    if (
      loading ||
      loadingHolidays ||
      !session?.user ||
      !projectSelectionReady ||
      !activeProjectId ||
      !activeProjectRegion ||
      monthStatus !== "ungenerated" ||
      holidayDates.size > 0
    ) {
      return;
    }

    const autoLoadKey = `${activeProjectId}|${activeProjectRegion}|${year}|${month}`;
    if (autoHolidayLoadKeysRef.current.has(autoLoadKey)) return;
    autoHolidayLoadKeysRef.current.add(autoLoadKey);
    void handleAutoLoadHolidays({ quietInfo: true });
  }, [
    activeProjectId,
    activeProjectRegion,
    handleAutoLoadHolidays,
    holidayDates.size,
    loading,
    loadingHolidays,
    month,
    monthStatus,
    projectSelectionReady,
    session?.user,
    year,
  ]);

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
  // Celdas bloqueadas por preparación manual (V, B o D manual)
  const lockedCells = new Set<string>(
    assignments
      .filter((a) => (a.shiftType === "V" || a.shiftType === "B" || (a.shiftType === "D" && a.manual)))
      .map((a) => `${a.employeeId}|${a.date.slice(0, 10)}`)
  );
  const vacacionesCount = assignments.filter((a) => a.shiftType === "V").length;
  const libresCount = assignments.filter((a) => a.shiftType === "D" && a.manual).length;
  const bajasCount = assignments.filter((a) => a.shiftType === "B").length;
  const activePrepShiftLabel =
    prepStep === "vacaciones" ? "V" :
    prepStep === "libres" ? "D" :
    prepStep === "bajas" ? "B" :
    null;

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
          {canEdit && activePrepShiftLabel && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1 print:hidden">
              Modo preparación — clic en celda para asignar {activePrepShiftLabel}
            </span>
          )}
          {canEdit && !activePrepShiftLabel && (
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
                  allowLockedCellClick={prepStep === "vacaciones" || prepStep === "libres" || prepStep === "bajas"}
                  currentUserId={session?.user?.id ?? null}
                />
                {employees.length > 0 && (
                  <div className="mt-2 flex w-fit max-w-full items-start gap-4 overflow-x-auto">
                    <CountersTable employees={employees} assignments={assignments} month={month} />
                    <ExtraPayTable employees={employees} assignments={assignments} month={month} />
                  </div>
                )}
                {monthStatus === "ungenerated" && (
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
                bajasCount={bajasCount}
                holidaysCount={holidayDates.size}
                onSavePreparation={handleSavePreparation}
                onGenerate={requestGenerate}
                generating={generating}
                isAdmin={isAdmin}
                onManageHolidays={() => router.push("/holidays")}
                projectRegion={activeProjectRegion}
                projectId={activeProjectId}
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
          getTransitionWarning={getTransitionWarning}
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
