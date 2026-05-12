import { type EmployeeRecord } from "@/app/employees/page";

interface EmployeeTableProps {
  employees: EmployeeRecord[];
  onEdit: (employee: EmployeeRecord) => void;
  onChangePassword: (employee: EmployeeRecord) => void;
  onHistory: (employee: EmployeeRecord) => void;
}

const ROLE_BADGES: Record<string, { label: string; classes: string }> = {
  SUPER_ADMIN: { label: "Super Admin", classes: "bg-blue-100 text-blue-700" },
  ADMIN: { label: "Admin", classes: "bg-blue-100 text-blue-700" }, // legacy compat
  USER: { label: "Técnico", classes: "bg-gray-100 text-gray-600" },
  EMPLOYEE: { label: "Técnico", classes: "bg-gray-100 text-gray-600" }, // legacy compat
};

export function EmployeeTable({ employees, onEdit, onChangePassword, onHistory }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No hay empleados registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">#</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Rol</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Proyecto</th>
            <th className="px-4 py-3 border-b border-gray-200" />
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => {
            const badge = ROLE_BADGES[emp.user.role] ?? { label: emp.user.role, classes: "bg-gray-100 text-gray-600" };
            return (
              <tr
                key={emp.id}
                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-yellow-50/40 transition-colors`}
              >
                <td className="px-4 py-3 text-gray-400 border-b border-gray-100">{emp.rotationOrder}</td>
                <td className="px-4 py-3 font-medium text-gray-800 border-b border-gray-100">{emp.name}</td>
                <td className="px-4 py-3 text-gray-600 border-b border-gray-100">{emp.user.email}</td>
                <td className="px-4 py-3 border-b border-gray-100">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${badge.classes}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-gray-600 text-sm">
                  {emp.project ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                      {emp.project.name}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => onEdit(emp)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onChangePassword(emp)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Clave
                    </button>
                    <button
                      onClick={() => onHistory(emp)}
                      data-testid={`btn-history-${emp.id}`}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Historial
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
