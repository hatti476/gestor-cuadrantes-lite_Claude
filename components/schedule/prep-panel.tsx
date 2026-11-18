"use client";

import { MonthStatus } from "@/lib/schedules/types";

interface PrepPanelProps {
  monthStatus: MonthStatus;
  vacacionesCount: number;
  libresCount: number;
  bajasCount: number;
  holidaysCount: number;
  onSavePreparation: () => void;
  onGenerate: () => void;
  generating: boolean;
  isAdmin: boolean;
  /** Ir a gestionar festivos */
  onManageHolidays: () => void;
  /** true mientras se cargan festivos automáticamente */
  loadingHolidays?: boolean;
  /** Carga festivos públicos automáticamente desde la API externa */
  onAutoLoadHolidays?: () => void;
}

const STATUS_BADGE: Record<MonthStatus, { label: string; className: string }> = {
  ungenerated: { label: "Sin generar", className: "bg-gray-100 text-gray-600 border-gray-300" },
  preparation: { label: "En preparación", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  generated: { label: "Generado", className: "bg-green-100 text-green-700 border-green-300" },
  unpublished: { label: "No publicado", className: "bg-gray-100 text-gray-600 border-gray-300" },
};

export function MonthStatusBadge({ status }: { status: MonthStatus }) {
  const badge = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
      data-testid="month-status-badge"
    >
      {badge.label}
    </span>
  );
}

/**
 * Panel de preparación del mes (SPEC-012, punto 1): ya no tiene pasos
 * clicables — el pintado de V/D/B/turnos se hace con la paleta de edición
 * (components/schedule/edit-palette.tsx) directamente sobre el grid. Este
 * panel conserva los contadores informativos, la gestión de festivos y las
 * acciones de guardar/generar.
 */
export function PrepPanel({
  monthStatus,
  vacacionesCount,
  libresCount,
  bajasCount,
  holidaysCount,
  onSavePreparation,
  onGenerate,
  generating,
  isAdmin,
  onManageHolidays,
  loadingHolidays = false,
  onAutoLoadHolidays,
}: PrepPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm print:hidden" data-testid="prep-panel">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preparación del mes</p>
      </div>

      {/* Contadores informativos */}
      <div className="p-3 space-y-1 text-xs text-gray-600">
        <div data-testid="prep-count-vacaciones">🏖️ <strong>{vacacionesCount}</strong> días de vacaciones</div>
        <div data-testid="prep-count-libres">📅 <strong>{libresCount}</strong> días libres</div>
        <div data-testid="prep-count-bajas">🩺 <strong>{bajasCount}</strong> días de baja</div>
        <div data-testid="prep-count-festivos">🎉 <strong>{holidaysCount}</strong> festivos del mes</div>
      </div>

      {/* Festivos */}
      <div className="mx-3 mb-3 space-y-2 border-t border-gray-100 pt-3">
        <p
          data-testid="msg-auto-holidays"
          className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2"
        >
          {loadingHolidays
            ? "Cargando festivos públicos..."
            : "Los festivos públicos se pueden cargar automáticamente."}
        </p>
        <button
          onClick={onManageHolidays}
          className="w-full text-xs px-3 py-2 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
          data-testid="btn-manage-holidays"
          style={{ display: isAdmin ? undefined : "none" }}
        >
          Gestionar festivos del mes →
        </button>
        {onAutoLoadHolidays && (
          <button
            onClick={onAutoLoadHolidays}
            className="w-full text-xs px-3 py-2 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
            data-testid="btn-auto-load-holidays"
          >
            Cargar festivos públicos →
          </button>
        )}
      </div>

      {/* Guardar / Generar */}
      <div className="mx-3 mb-3 space-y-2 border-t border-gray-100 pt-3">
        <button
          data-testid="btn-save-preparation"
          onClick={onSavePreparation}
          disabled={monthStatus === "generated"}
          className="w-full text-xs px-3 py-2 rounded border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 disabled:opacity-40 transition-colors"
        >
          Guardar preparación
        </button>
        <button
          data-testid="btn-generate"
          onClick={onGenerate}
          disabled={generating}
          className="w-full text-xs px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
        >
          {generating ? "Generando..." : "Generar cuadrante"}
        </button>
      </div>
    </div>
  );
}
