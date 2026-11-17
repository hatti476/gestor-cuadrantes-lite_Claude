"use client";

import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";

/** Turno a aplicar, o "borrar" para vaciar la celda */
export type PaletteTool = ShiftType | "borrar";

const PALETTE_SHIFTS: ShiftType[] = ["M", "T", "N", "J", "D", "V", "B"];

interface EditPaletteProps {
  selected: PaletteTool | null;
  onSelect: (tool: PaletteTool) => void;
}

/**
 * Paleta única de edición del cuadrante (SPEC-012, punto 1): sustituye los
 * pasos de preparación y el modal de turno. Se selecciona un turno aquí y
 * luego se pinta sobre el grid con clic o clic-y-arrastre.
 */
export function EditPalette({ selected, onSelect }: EditPaletteProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white shadow-sm p-3 print:hidden select-none"
      data-testid="edit-palette"
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Paleta de turnos</p>
      <div className="flex flex-wrap gap-1.5">
        {PALETTE_SHIFTS.map((shift) => {
          const { color, textColor, label } = SHIFT_COLORS[shift];
          const isSelected = selected === shift;
          return (
            <button
              key={shift}
              type="button"
              data-testid={`palette-swatch-${shift}`}
              title={label}
              onClick={() => onSelect(shift)}
              className={`w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center transition-transform ${
                isSelected ? "ring-2 ring-offset-2 ring-blue-500 scale-105" : "hover:scale-105"
              }`}
              style={{ backgroundColor: color, color: textColor }}
            >
              {shift}
            </button>
          );
        })}
        <button
          type="button"
          data-testid="palette-swatch-borrar"
          title="Borrar turno"
          onClick={() => onSelect("borrar")}
          className={`w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center border-2 border-dashed transition-transform text-gray-400 hover:bg-gray-50 ${
            selected === "borrar" ? "ring-2 ring-offset-2 ring-blue-500 scale-105 border-gray-400" : "border-gray-300"
          }`}
        >
          ✕
        </button>
      </div>
      {selected && (
        <p className="mt-2 text-[11px] text-blue-600" data-testid="palette-hint">
          Clic o arrastra sobre las celdas para{" "}
          {selected === "borrar" ? "borrar el turno" : `asignar "${selected}"`}.
        </p>
      )}
    </div>
  );
}
