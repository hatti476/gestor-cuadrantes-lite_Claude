"use client";

import { useState } from "react";
import { type EmployeeRecord } from "@/app/employees/page";

type CreateData = { name: string; email: string; password: string; role: string };
type EditData = { name?: string; role?: string };

interface EmployeeFormProps {
  mode: "create";
  onSubmit: (data: CreateData) => Promise<void>;
  onClose: () => void;
  initial?: never;
}

interface EmployeeFormEditProps {
  mode: "edit";
  initial: EmployeeRecord;
  onSubmit: (data: EditData) => Promise<void>;
  onClose: () => void;
}

export function EmployeeForm(props: EmployeeFormProps | EmployeeFormEditProps) {
  const { mode, onClose } = props;

  const [name, setName] = useState(mode === "edit" ? props.initial.name : "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(mode === "edit" ? props.initial.user.role : "USER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        await (props as EmployeeFormProps).onSubmit({ name, email, password, role });
      } else {
        await (props as EmployeeFormEditProps).onSubmit({ name, role });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-96 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {mode === "create" ? "Nuevo empleado" : `Editar — ${props.initial.name}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none" aria-label="Cerrar">×</button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="emp-name">Nombre</label>
            <input
              id="emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Nombre completo"
            />
          </div>

          {/* Email — solo en creación */}
          {mode === "create" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600" htmlFor="emp-email">Email</label>
              <input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="usuario@dominio.com"
              />
            </div>
          )}

          {/* Contraseña — solo en creación */}
          {mode === "create" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600" htmlFor="emp-password">Contraseña</label>
              <input
                id="emp-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
              />
            </div>
          )}

          {/* Rol */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="emp-role">Rol</label>
            <select
              id="emp-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="USER">Técnico (USER)</option>
              <option value="SUPER_ADMIN">Administrador (SUPER_ADMIN)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Guardando..." : mode === "create" ? "Crear empleado" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
