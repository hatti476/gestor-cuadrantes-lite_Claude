import { SHIFT_COLORS, ShiftType } from "@/lib/constants/shift-colors";

interface ShiftCellProps {
  shiftType: ShiftType;
}

export function ShiftCell({ shiftType }: ShiftCellProps) {
  const config = SHIFT_COLORS[shiftType];

  return (
    <div
      className="flex items-center justify-center w-full h-full text-xs font-bold rounded-sm select-none"
      style={{
        backgroundColor: config.color,
        color: config.textColor,
      }}
      title={config.label}
    >
      {shiftType}
    </div>
  );
}
