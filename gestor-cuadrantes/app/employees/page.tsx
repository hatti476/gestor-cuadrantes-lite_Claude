"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeForm } from "@/components/employees/employee-form";
import { PasswordForm } from "@/components/employees/password-form";

export interface EmployeeRecord {
  id: string;
  name: string;
  rotationOrder: number;
  user: { email: string; role: string };
  project: { id: string; name: string } | null;
}

interface HistoryLog {
  id: string;
  date: string;
  oldShift: string | null;
  newShift: string;
  changedBy: string;
  changedAt: string;
}

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [passwordEmployee, setPasswordEmployee] = useState<EmployeeRecord | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<EmployeeRecord | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirigir si no es ADMIN
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "SUPER_ADMIN") {
      router.replace("/");
    }
  }, [session, status, router]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Error cargando empleados");
      setEmployees(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user.role === "SUPER_ADMIN") loadEmployees();
  }, [session, loadEmployees]);

  async function handleCreate(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Error creando empleado");
    }
    setShowForm(false);
    await loadEmployees();
  }

  async function handleUpdate(id: string, data: { name?: string; role?: string }) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Error actualizando empleado");
    }
    setEditingEmployee(null);
    await loadEmployees();
  }

  async function openHistory(emp: EmployeeRecord) {
    setHistoryEmployee(emp);
    setHistoryLoading(true);
    setHistoryLogs([]);
    const res = await fetch(`/api/employees/${emp.id}/history`);
    if (res.ok) setHistoryLogs(await res.json());
    setHistoryLoading(false);
  }

  if (status === "loading" || (session?.user.role !== "SUPER_ADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Gestión de Empleados</h2>
          <button
            onClick={() => { setShowForm(true); setEditingEmployee(null); }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nuevo empleado
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            Cargando empleados...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <EmployeeTable
              employees={employees}
              onEdit={(emp) => { setEditingEmployee(emp); setShowForm(false); }}
              onChangePassword={(emp) => setPasswordEmployee(emp)}
              onHistory={openHistory}
            />
          </div>
        )}

        {/* Formulario de creación */}
        {showForm && (
          <EmployeeForm
            mode="create"
            onSubmit={handleCreate}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Formulario de edición */}
        {editingEmployee && (
          <EmployeeForm
            mode="edit"
            initial={editingEmployee}
            onSubmit={(data) => handleUpdate(editingEmployee.id, data)}
            onClose={() => setEditingEmployee(null)}
          />
        )}

        {/* Modal de cambio de contraseña */}
        {passwordEmployee && (
          <PasswordForm
            employeeId={passwordEmployee.id}
            employeeName={passwordEmployee.name}
            onClose={() => setPasswordEmployee(null)}
            onSuccess={() => setPasswordEmployee(null)}
          />
        )}

        {/* Modal de historial de cambios */}
        {historyEmployee && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">
                  Historial — {historyEmployee.name}
                </h3>
                <button
                  onClick={() => setHistoryEmployee(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto flex-1 p-4">
                {historyLoading ? (
                  <p className="text-center text-gray-400 py-8">Cargando historial...</p>
                ) : historyLogs.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Sin cambios registrados.</p>
                ) : (
                  <table data-testid="history-table" className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">Fecha turno</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">Anterior</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">Nuevo</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">Modificado por</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">Fecha cambio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{log.date.slice(0, 10)}</td>
                          <td className="px-3 py-2 text-gray-500">{log.oldShift ?? "—"}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{log.newShift}</td>
                          <td className="px-3 py-2 text-gray-600">{log.changedBy}</td>
                          <td className="px-3 py-2 text-gray-500">{new Date(log.changedAt).toLocaleString("es-ES")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
