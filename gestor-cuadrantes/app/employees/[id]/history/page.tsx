"use client";
import { useEffect, useState } from "react";
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

export default function EmployeeHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN") router.replace("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    async function load() {
      try {
        const [empRes, logRes] = await Promise.all([
          fetch(`/api/employees`),
          fetch(`/api/employees/${id}/history`),
        ]);
        if (empRes.ok) {
          const emps = await empRes.json();
          const emp = emps.find((e: { id: string; name: string }) => e.id === id);
          if (emp) setEmployeeName(emp.name);
        }
        if (logRes.ok) setLogs(await logRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, id]);

  if (status === "loading" || loading) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
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

        {logs.length === 0 ? (
          <p className="text-center text-gray-400 py-10" data-testid="no-history">
            Sin cambios registrados para este empleado
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm" data-testid="history-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha turno</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Turno anterior</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Turno nuevo</th>
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
      </div>
    </main>
  );
}
