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
}

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [passwordEmployee, setPasswordEmployee] = useState<EmployeeRecord | null>(null);
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
          <EmployeeTable
            employees={employees}
            onEdit={(emp) => { setEditingEmployee(emp); setShowForm(false); }}
            onChangePassword={(emp) => setPasswordEmployee(emp)}
          />
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
      </main>
    </div>
  );
}
