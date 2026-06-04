"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
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
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") ?? "";
  const yearParam  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()), 10);
  const monthParam = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [span, setSpan] = useState(3);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    if (!projectId || status !== "authenticated") return;
    setLoading(true);
    setError(null);
    try {
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
  }, [projectId, yearParam, monthParam, span, status]);

  useEffect(() => { void load(); }, [load]);

  if (status === "loading" || status === "unauthenticated") return null;

  // Build shift lookup: empId|YYYY-MM-DD → shiftType
  const shiftLookup = new Map<string, string>();
  for (const md of monthsData) {
    for (const a of md.assignments) {
      shiftLookup.set(`${a.employeeId}|${a.date.slice(0, 10)}`, a.shiftType);
    }
  }

  // Ordered column list: {year, month, day, dow}
  const columns: Array<{ year: number; month: number; day: number; dow: number }> = [];
  for (const md of monthsData) {
    const days = daysInMonth(md.year, md.month);
    for (let d = 1; d <= days; d++) {
      columns.push({ year: md.year, month: md.month, day: d, dow: dayOfWeek(md.year, md.month, d) });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm transition-colors print:hidden"
          >
            ‹ Volver
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            Vista ampliada — {MONTH_NAMES_ES[monthParam - 1]} {yearParam}
          </h2>
          <div className="ml-auto flex items-center gap-3 print:hidden">
            <label htmlFor="span-select" className="text-sm text-gray-600 font-medium">
              Meses:
            </label>
            <select
              id="span-select"
              value={span}
              onChange={(e) => setSpan(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[2, 3, 4, 6].map((n) => (
                <option key={n} value={n}>{n} meses</option>
              ))}
            </select>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm transition-colors"
            >
              Imprimir
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Cargando cuadrante…
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="border-collapse text-xs" style={{ tableLayout: "fixed" }}>
              <thead>
                {/* Month header row */}
                <tr>
                  <th
                    className="sticky left-0 z-20 bg-white border-b border-r border-gray-200 px-3 py-2"
                    style={{ minWidth: 140, width: 140 }}
                  />
                  {monthsData.map((md) => (
                    <th
                      key={`${md.year}-${md.month}`}
                      colSpan={daysInMonth(md.year, md.month)}
                      className="border-b border-r border-gray-200 bg-indigo-50 text-indigo-700 font-semibold text-center py-1.5 px-2 text-xs"
                    >
                      {MONTH_NAMES_ES[md.month - 1]} {md.year}
                    </th>
                  ))}
                </tr>
                {/* Day header row */}
                <tr>
                  <th
                    className="sticky left-0 z-20 bg-white border-b border-r border-gray-200 px-3 py-1.5 text-left text-xs font-medium text-gray-500"
                    style={{ minWidth: 140, width: 140 }}
                  >
                    Empleado
                  </th>
                  {columns.map((col) => {
                    const isWeekend = col.dow === 0 || col.dow === 6;
                    const isLastOfMonth =
                      col.day === daysInMonth(col.year, col.month);
                    return (
                      <th
                        key={`h-${col.year}-${col.month}-${col.day}`}
                        className={`border-b border-gray-200 text-center py-0.5 ${
                          isLastOfMonth ? "border-r border-r-gray-300" : ""
                        } ${isWeekend ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"}`}
                        style={{ minWidth: 26, width: 26 }}
                      >
                        <div className="text-[10px] font-medium leading-tight">{DAY_SHORT_ES[col.dow]}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{col.day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, empIdx) => (
                  <tr
                    key={emp.id}
                    className={empIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    {/* Employee name */}
                    <td
                      className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-1 text-xs font-medium text-gray-800 whitespace-nowrap ${
                        empIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                      style={{ minWidth: 140, width: 140 }}
                    >
                      {emp.name}
                    </td>
                    {/* Shift cells */}
                    {columns.map((col) => {
                      const ds = dateStr(col.year, col.month, col.day);
                      const shift = shiftLookup.get(`${emp.id}|${ds}`) ?? "";
                      const isWeekend = col.dow === 0 || col.dow === 6;
                      const isLastOfMonth = col.day === daysInMonth(col.year, col.month);
                      const shiftConfig = SHIFT_COLORS[shift as ShiftType];

                      return (
                        <td
                          key={ds}
                          className={`p-0 text-center border-b border-gray-100 ${
                            isLastOfMonth ? "border-r border-r-gray-300" : ""
                          } ${isWeekend && !shiftConfig ? "bg-amber-50/30" : ""}`}
                          style={{ minWidth: 26, width: 26 }}
                        >
                          {shiftConfig ? (
                            <span
                              className="block w-full h-full py-0.5 text-[10px] font-bold leading-5 text-center"
                              style={{
                                backgroundColor: shiftConfig.color,
                                color: shiftConfig.textColor,
                              }}
                            >
                              {shift}
                            </span>
                          ) : (
                            <span className="block w-full h-full py-0.5 leading-5" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      Sin empleados en este proyecto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
