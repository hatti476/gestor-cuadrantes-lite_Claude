"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

interface Holiday {
  id: string;
  date: string;
  description: string;
  year: number;
}

export default function HolidaysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/holidays?year=${year}`);
      if (res.ok) setHolidays(await res.json());
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN") router.replace("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") fetchHolidays();
  }, [status, fetchHolidays]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!dateInput || !descInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateInput, description: descInput.trim() }),
      });
      if (res.ok) {
        showToast("Festivo añadido correctamente", "success");
        setDateInput("");
        setDescInput("");
        fetchHolidays();
      } else {
        const { error } = await res.json();
        showToast(error ?? "Error al añadir festivo", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Festivo eliminado", "success");
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } else {
      showToast("Error al eliminar festivo", "error");
    }
  }

  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Festivos</h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Volver al cuadrante
          </button>
        </div>

        {/* Selector de año */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-gray-700">Año:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Formulario de alta */}
        <form
          onSubmit={handleAdd}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-end shadow-sm"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              required
              data-testid="holiday-date-input"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <input
              type="text"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder="Ej: Día de la Constitución"
              required
              data-testid="holiday-desc-input"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            data-testid="btn-add-holiday"
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Añadiendo…" : "Añadir"}
          </button>
        </form>

        {/* Tabla de festivos */}
        {loading ? (
          <p className="text-center text-gray-400 py-10">Cargando…</p>
        ) : holidays.length === 0 ? (
          <p className="text-center text-gray-400 py-10" data-testid="no-holidays">
            No hay festivos registrados para {year}
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Descripción</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => (
                  <tr key={h.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-gray-700">
                      {new Date(h.date).toLocaleDateString("es-ES", {
                        day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
                      })}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{h.description}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(h.id)}
                        data-testid={`btn-delete-holiday-${h.id}`}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Eliminar
                      </button>
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
