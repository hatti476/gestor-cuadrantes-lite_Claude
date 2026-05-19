"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface LogEntry {
  id: string;
  date: string;
  oldShift: string | null;
  newShift: string;
  changedBy: string;
  changedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HistoryResponse {
  data: LogEntry[];
  pagination: Pagination;
  availableMonths: string[];
}

const LIMIT = 20;

export default function EmployeeHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isAnyProjectAdmin =
    (session?.user?.projectMemberships ?? []).some(
      (m: { role: string }) => m.role === "PROJECT_ADMIN"
    );
  const canAccess = isSuperAdmin || isAnyProjectAdmin;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && !canAccess) router.replace("/");
  }, [status, canAccess, router]);

  // Cargar nombre del empleado una sola vez
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/employees")
      .then((r) => (r.ok ? r.json() : []))
      .then((emps: { id: string; name: string }[]) => {
        const emp = emps.find((e) => e.id === id);
        if (emp) setEmployeeName(emp.name);
      })
      .catch(() => {});
  }, [status, id]);

  const loadHistory = useCallback(
    async (page: number, month: string) => {
      setLoading(true);
      try {
        const monthParam = month ? `&month=${month}` : "";
        const res = await fetch(
          `/api/employees/${id}/history?page=${page}&limit=${LIMIT}${monthParam}`
        );
        if (res.ok) {
          const data: HistoryResponse = await res.json();
          setLogs(data.data);
          setPagination(data.pagination);
          setAvailableMonths(data.availableMonths);
        }
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (status !== "authenticated" || !canAccess) return;
    void Promise.resolve().then(() => loadHistory(1, ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, canAccess]);

  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    void loadHistory(1, month);
  }

  function handlePage(newPage: number) {
    void loadHistory(newPage, selectedMonth);
  }

  function formatMonth(yyyyMM: string): string {
    const [y, m] = yyyyMM.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }

  if (status === "loading" || (loading && logs.length === 0)) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <span className="text-gray-400">Cargando...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Historial — {employeeName || id}
          </h1>
          <button
            onClick={() => router.push("/employees")}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Volver a empleados
          </button>
        </div>

        {/* Filtro de mes */}
        <div className="mb-4 flex items-center gap-3">
          <label
            htmlFor="month-filter"
            className="text-sm font-medium text-gray-600 whitespace-nowrap"
          >
            Filtrar por mes:
          </label>
          <select
            id="month-filter"
            data-testid="month-filter"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white"
          >
            <option value="">Todos los meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador de paginación */}
        {!loading && (
          <p data-testid="pagination-info" className="text-xs text-gray-400 mb-3">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} cambio
            {pagination.total !== 1 ? "s" : ""} totales)
          </p>
        )}

        {/* Tabla */}
        {logs.length === 0 && !loading ? (
          <p className="text-center text-gray-400 py-10" data-testid="no-history">
            Sin cambios registrados para este empleado
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm" data-testid="history-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha turno</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Anterior</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Nuevo</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Cambiado por</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-gray-700">
                      {new Date(log.date).toLocaleDateString("es-ES", {
                        day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
                      })}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{log.oldShift ?? "—"}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800">{log.newShift}</td>
                    <td className="px-4 py-2 text-gray-600">{log.changedBy}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {new Date(log.changedAt).toLocaleString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Controles de paginación */}
        {pagination.totalPages > 1 && (
          <div
            className="mt-4 flex items-center justify-between"
            data-testid="pagination-controls"
          >
            <button
              data-testid="btn-prev-page"
              onClick={() => handlePage(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              data-testid="btn-next-page"
              onClick={() => handlePage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
