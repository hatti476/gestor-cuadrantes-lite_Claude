"use client";

import { MonthStatus } from "@/lib/schedules/types";

export type PrepStep = "vacaciones" | "libres" | "festivos" | "generar" | null;

interface PrepPanelProps {
  monthStatus: MonthStatus;
  activeStep: PrepStep;
  onStepChange: (step: PrepStep) => void;
  vacacionesCount: number;
  libresCount: number;
  holidaysCount: number;
  onSavePreparation: () => void;
  onGenerate: () => void;
  generating: boolean;
  isAdmin: boolean;
  /** Ir a gestionar festivos */
  onManageHolidays: () => void;
  /** Región CCAA del proyecto activo (null si no configurada) */
  projectRegion?: string | null;
  /** ID del proyecto activo (para enlace a edición) */
  projectId?: string | null;
  /** Llamado al pulsar "Cargar festivos automáticamente" */
  onAutoLoadHolidays?: () => Promise<void>;
  /** true mientras se cargan festivos automáticamente */
  loadingHolidays?: boolean;
}

const STATUS_BADGE: Record<MonthStatus, { label: string; className: string }> = {
  ungenerated: { label: "Sin generar", className: "bg-gray-100 text-gray-600 border-gray-300" },
  preparation: { label: "En preparación", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  generated: { label: "Generado", className: "bg-green-100 text-green-700 border-green-300" },
};

const STEPS: { id: PrepStep; label: string; icon: string; description: string }[] = [
  { id: "vacaciones", label: "Vacaciones", icon: "🏖️", description: "Haz clic en celdas para marcar días de vacaciones (V). Quedan bloqueadas." },
  { id: "libres", label: "Días libres", icon: "📅", description: "Haz clic en celdas para marcar descansos excepcionales (D). Quedan bloqueados." },
  { id: "festivos", label: "Festivos", icon: "🎉", description: "Revisa y gestiona los festivos del mes." },
  { id: "generar", label: "Generar", icon: "⚙️", description: "Guarda la preparación y genera el cuadrante automáticamente." },
];

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

export function PrepPanel({
  monthStatus,
  activeStep,
  onStepChange,
  vacacionesCount,
  libresCount,
  holidaysCount,
  onSavePreparation,
  onGenerate,
  generating,
  isAdmin,
  onManageHolidays,
  projectRegion,
  projectId,
  onAutoLoadHolidays,
  loadingHolidays = false,
}: PrepPanelProps) {
  if (!isAdmin) return null;

  const stepCounts: Record<string, number> = {
    vacaciones: vacacionesCount,
    libres: libresCount,
    festivos: holidaysCount,
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm print:hidden" data-testid="prep-panel">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preparación del mes</p>
      </div>

      {/* Steps */}
      <div className="p-3 space-y-1">
        {STEPS.map((step, idx) => {
          const isActive = activeStep === step.id;
          const count = stepCounts[step.id ?? ""];
          return (
            <button
              key={step.id}
              data-testid={`prep-step-${step.id}`}
              onClick={() => onStepChange(isActive ? null : step.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                isActive
                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                  : "hover:bg-gray-50 text-gray-700 border border-transparent"
              }`}
            >
              <span className="text-base w-6 text-center">{step.icon}</span>
              <span className="flex-1 font-medium">
                {idx + 1}. {step.label}
              </span>
              {count !== undefined && (
                <span className={`text-xs rounded-full px-2 py-0.5 font-mono ${count > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active step description */}
      {activeStep && activeStep !== "generar" && (
        <div className="mx-3 mb-3 p-2 rounded bg-blue-50 border border-blue-100 text-xs text-blue-700">
          {STEPS.find((s) => s.id === activeStep)?.description}
        </div>
      )}

      {/* Festivos sub-panel */}
      {activeStep === "festivos" && (
        <div className="mx-3 mb-3 space-y-2">
          {/* Botón de carga automática o mensaje según si hay región */}
          {projectRegion ? (
            <button
              data-testid="btn-auto-load-holidays"
              onClick={onAutoLoadHolidays}
              disabled={loadingHolidays}
              className="w-full text-xs px-3 py-2 rounded border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-50 transition-colors"
            >
              {loadingHolidays ? "Cargando..." : "Cargar festivos automáticamente"}
            </button>
          ) : (
            <p
              data-testid="msg-no-region"
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2"
            >
              Configura la región del proyecto para usar esta función{" "}
              {projectId && (
                <a
                  href="/projects"
                  className="underline font-medium hover:text-amber-900"
                  data-testid="link-configure-region"
                >
                  →
                </a>
              )}
            </p>
          )}
          <button
            onClick={onManageHolidays}
            className="w-full text-xs px-3 py-2 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
            data-testid="btn-manage-holidays"
          >
            Gestionar festivos del mes →
          </button>
        </div>
      )}

      {/* Generar step */}
      {(activeStep === "generar" || activeStep === null) && (
        <div className="mx-3 mb-3 space-y-2">
          <div className="text-xs text-gray-500 space-y-1">
            <div>🏖️ <strong>{vacacionesCount}</strong> días de vacaciones bloqueados</div>
            <div>📅 <strong>{libresCount}</strong> días libres bloqueados</div>
            <div>🎉 <strong>{holidaysCount}</strong> festivos del mes</div>
          </div>
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
      )}

      {/* Divider + close step */}
      {activeStep && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onStepChange(null)}
            className="w-full text-xs py-1 text-gray-400 hover:text-gray-600"
          >
            ✕ Cerrar panel
          </button>
        </div>
      )}
    </div>
  );
}
