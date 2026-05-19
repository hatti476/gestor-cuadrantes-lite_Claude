// Colores asociados a cada tipo de turno del cuadrante.
// Fuente de verdad para todos los componentes — no hardcodear en ningún otro lugar.

export type ShiftType =
  | "M"
  | "T"
  | "N"
  | "J"
  | "D"
  | "V"
  | "B"
  | "MF"
  | "TF"
  | "NF"
  | "MN"
  | "TN"
  | "NN";

export interface ShiftConfig {
  label: string;
  /** Color hexadecimal de fondo de la celda */
  color: string;
  /** Color del texto para asegurar contraste suficiente sobre el fondo */
  textColor: string;
}

export const SHIFT_COLORS: Record<ShiftType, ShiftConfig> = {
  // Turnos MVP
  M: {
    label: "Mañana",
    color: "#FF9800",
    textColor: "#FFFFFF",
  },
  T: {
    label: "Tarde",
    color: "#2196F3",
    textColor: "#FFFFFF",
  },
  N: {
    label: "Noche",
    color: "#4CAF50",
    textColor: "#FFFFFF",
  },
  J: {
    label: "Jornada normal",
    color: "#FFC107",
    textColor: "#212121",
  },
  D: {
    label: "Descanso",
    color: "#F5F5F5",
    textColor: "#424242",
  },
  V: {
    label: "Vacaciones",
    color: "#212121",
    textColor: "#FFFFFF",
  },
  B: {
    label: "Baja",
    color: "#37474F",
    textColor: "#FFFFFF",
  },
  // Turnos fin de semana (v2)
  MF: {
    label: "Mañana Finde",
    color: "#E65100",
    textColor: "#FFFFFF",
  },
  TF: {
    label: "Tarde Finde",
    color: "#0D47A1",
    textColor: "#FFFFFF",
  },
  NF: {
    label: "Noche Finde",
    color: "#1B5E20",
    textColor: "#FFFFFF",
  },
  // Turnos especiales de Navidad
  MN: {
    label: "Mañana Navidad",
    color: "#BE123C",
    textColor: "#FFFFFF",
  },
  TN: {
    label: "Tarde Navidad",
    color: "#047857",
    textColor: "#FFFFFF",
  },
  NN: {
    label: "Noche Navidad",
    color: "#0B6B2B",
    textColor: "#FFFFFF",
  },
};

/** Devuelve la config de un turno, o un fallback genérico si el código no existe */
export function getShiftConfig(shiftType: string): ShiftConfig {
  return (
    SHIFT_COLORS[shiftType as ShiftType] ?? {
      label: shiftType,
      color: "#E0E0E0",
      textColor: "#212121",
    }
  );
}
