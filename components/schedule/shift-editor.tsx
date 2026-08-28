"use client";

import { useState } from "react";
import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";

const SHIFT_OPTIONS: ShiftType[] = ["M", "T", "N", "J", "D", "V", "B", "MF", "TF", "NF", "MN", "TN", "NN"];

interface ShiftEditorProps {
  date: string; // "YYYY-MM-DD"
  currentShift?: string;
  onSave: (shiftType: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  getTransitionWarning?: (shiftType: string) => string | null;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function ShiftEditor({
  date,
  currentShift,
  onSave,
  onDelete,
  onClose,
  getTransitionWarning,
}: ShiftEditorProps) {
  const [pendingShift, setPendingShift] = useState<string | null>(null);
  const [transitionWarning, setTransitionWarning] = useState<string | null>(null);

  function handleShiftSelection(shift: string) {
    const warning = getTransitionWarning?.(shift) ?? null;
    if (warning) {
      setPendingShift(shift);
      setTransitionWarning(warning);
      return;
    }
    onSave(shift);
  }

  return (
    // Overlay
    <div
      data-testid="shift-editor"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">
            Turno — {formatDate(date)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Selector de turno */}
        <div className="grid grid-cols-4 gap-2">
          {SHIFT_OPTIONS.map((shift) => {
            const { color, textColor, label } = SHIFT_COLORS[shift];
            const isActive = currentShift === shift;
            return (
              <button
                key={shift}
                onClick={() => handleShiftSelection(shift)}
                data-testid={`shift-btn-${shift}`}
                title={label}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                  isActive ? "border-blue-500 scale-105" : "border-transparent hover:border-gray-200"
                }`}
                style={{ backgroundColor: color, color: textColor }}
              >
                <span className="text-sm font-bold">{shift}</span>
                <span className="text-[9px] leading-tight text-center opacity-90">{label}</span>
              </button>
            );
          })}
        </div>

        {transitionWarning && pendingShift && (
          <div
            data-testid="et-warning"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          >
            <p>{transitionWarning}</p>
            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setPendingShift(null);
                  setTransitionWarning(null);
                }}
                className="px-2 py-1 rounded border border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="btn-confirm-et-warning"
                onClick={() => onSave(pendingShift)}
                className="px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Limpiar celda
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
