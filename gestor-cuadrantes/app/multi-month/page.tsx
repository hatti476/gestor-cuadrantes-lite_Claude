"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";
import type { ScheduleAssignment, ScheduleEmployee } from "@/lib/schedules/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }
  return { year: y, month: m };
}

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_SHORT_ES = ["D", "L", "M", "X", "J", "V", "S"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dayOfWeek(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun
}

// ── types ─────────────────────────────────────────────────────────────────────

interface MonthData {
  year: number;
  month: number;
  assignments: ScheduleAssignment[];
}

// ── component ─────────────────────────────────────────────────────────────────

export default function MultiMonthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") ?? "";
  const yearParam  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()), 10);
  const monthParam = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Number of months to display (3 by default — center month ± 1)
  const [span, setSpan] = useState(3);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // Build the list of {year, month} to fetch
      const offset = Math.floor(span / 2);
      const periods: Array<{ year: number; month: number }> = [];
      for (let d = -offset; d < span - offset; d++) {
        periods.push(addMonths(yearParam, monthParam, d));
      }

      const [empRes, ...schedRes] = await Promise.all([
        fetch(`/api/employees?projectId=${projectId}`),
        ...periods.map((p) =>
          fetch(`/api/schedules?year=${p.year}&month=${p.month}&projectId=${projectId}`)
        ),
      ]);

      if (!empRes.ok) throw new Error("Error al cargar empleados");

      const apiEmployees: (ScheduleEmployee & { userId?: string })[] = await empRes.json();
      const sorted = apiEmployees
        .sort((a, b) => a.rotationOrder - b.rotationOrder)
        .map((e) => ({ ...e, userId: e.userId ?? null }));
      setEmployees(sorted);

      const data: MonthData[] = [];
      for (let i = 0; i < periods.length; i++) {
        const res = schedRes[i];
        const assignments: ScheduleAssignment[] = res.ok
          ? ((await res.json()).assignments ?? [])
          : [];
        data.push({ ...periods[i], assignments });
      }
      setMonthsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [projectId, yearParam, monthParam, span]);

  useEffect(() => { load(); }, [load]);

  // Build a lookup: empId|YYYY-MM-DD → shift
  const shiftLookup = new Map<string, string>();
  for (const md of monthsData) {
    for (const a of md.assignments) {
      shiftLookup.set(`${a.employeeId}|${a.date.slice(0, 10)}`, a.shiftType);
    }
  }

  // All columns: an ordered list of {year, month, day}
  const columns: Array<{ year: number; month: number; day: number; dow: number }> = [];
  for (const md of monthsData) {
    const days = daysInMonth(md.year, md.month);
    for (let d = 1; d <= days; d++) {
      columns.push({ year: md.year, month: md.month, day: d, dow: dayOfWeek(md.year, md.month, d) });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
        >
          ← Volver
        </button>
        <h1 className="text-base font-semibold text-gray-800">
          Vista ampliada —{" "}
          {MONTH_NAMES_ES[(monthParam - 1 + 12) % 12]} {yearParam}
        </h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          <label htmlFor="span-select" className="font-medium">Meses:</label>
          <select
            id="span-select"
            value={span}
            onChange={(e) => setSpan(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 bg-white"
          >
            {[2, 3, 4, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => window.print()}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
        >
          Imprimir
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Cargando cuadrante…
          </div>
        )}
        {error && (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs" style={{ tableLayout: "fixed" }}>
              <thead>
                {/* Month headers */}
                <tr>
                  {/* Employee name column */}
                  <th
                    className="sticky left-0 z-20 bg-white border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                    style={{ minWidth: 140, width: 140 }}
                  />
                  {monthsData.map((md) => (
                    <th
                      key={`${md.year}-${md.month}`}
                      colSpan={daysInMonth(md.year, md.month)}
                      className="border border-gray-200 bg-indigo-50 text-indigo-800 font-semibold text-center py-1"
                    >
                      {MONTH_NAMES_ES[md.month - 1]} {md.year}
                    </th>
                  ))}
                </tr>
                {/* Day-of-week + day-number row */}
                <tr>
                  <th
                    className="sticky left-0 z-20 bg-white border border-gray-200 px-3 py-1 text-left text-gray-500 font-medium"
                    style={{ minWidth: 140, width: 140 }}
                  >
                    Empleado
                  </th>
                  {columns.map((col) => {
                    const isWeekend = col.dow === 0 || col.dow === 6;
                    return (
                      <th
                        key={`${col.year}-${col.month}-${col.day}`}
                        className={`border border-gray-200 text-center font-medium py-0.5 ${
                          isWeekend ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"
                        }`}
                        style={{ minWidth: 28, width: 28 }}
                      >
                        <div className="leading-tight">{DAY_SHORT_ES[col.dow]}</div>
                        <div className="leading-tight text-gray-400">{col.day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-indigo-50/30">
                    {/* Employee name */}
                    <td
                      className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-1 font-medium text-gray-800 whitespace-nowrap"
                      style={{ minWidth: 140, width: 140 }}
                    >
                      {emp.name}
                    </td>
                    {/* Shift cells */}
                    {columns.map((col) => {
                      const ds = dateStr(col.year, col.month, col.day);
                      const shift = shiftLookup.get(`${emp.id}|${ds}`) ?? "";
                      const isWeekend = col.dow === 0 || col.dow === 6;
                      const colors = SHIFT_COLORS[shift as ShiftType] ?? SHIFT_COLORS["D"];
                      const isEmpty = !shift || shift === "D";
                      return (
                        <td
                          key={ds}
                          className={`border border-gray-100 text-center p-0 ${
                            isWeekend && isEmpty ? "bg-amber-50/40" : ""
                          }`}
                          style={{ minWidth: 28, width: 28 }}
                        >
                          {shift && shift !== "D" ? (
                            <span
                              className="block w-full h-full py-0.5 font-bold leading-5"
                              style={{
                                backgroundColor: colors.color,
                                color: colors.textColor,
                              }}
                            >
                              {shift}
                            </span>
                          ) : (
                            <span className="block w-full h-full py-0.5 text-gray-300 leading-5">
                              {shift === "D" ? "D" : ""}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-8 text-gray-400"
                    >
                      Sin empleados en este proyecto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
