import { type EmployeeRecord } from "@/app/employees/page";

const PREF_BADGES: Record<string, { label: string; classes: string }> = {
  M: { label: "Mañanas", classes: "bg-orange-100 text-orange-700" },
  T: { label: "Tardes", classes: "bg-blue-100 text-blue-700" },
};

interface EmployeeTableProps {
  employees: EmployeeRecord[];
  onEdit: (employee: EmployeeRecord) => void;
  onChangePassword: (employee: EmployeeRecord) => void;
  onHistory: (employee: EmployeeRecord) => void;
  onDeactivate: (employee: EmployeeRecord) => void;
  onReactivate: (id: string) => void;
}

const ROLE_BADGES: Record<string, { label: string; classes: string }> = {
  SUPER_ADMIN: { label: "Super Admin", classes: "bg-blue-100 text-blue-700" },
  ADMIN: { label: "Admin", classes: "bg-blue-100 text-blue-700" }, // legacy compat
  USER: { label: "Técnico", classes: "bg-gray-100 text-gray-600" },
  EMPLOYEE: { label: "Técnico", classes: "bg-gray-100 text-gray-600" }, // legacy compat
};

export function EmployeeTable({ employees, onEdit, onChangePassword, onHistory, onDeactivate, onReactivate }: EmployeeTableProps) {
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
            const prefBadge = emp.shiftPreference ? PREF_BADGES[emp.shiftPreference] : null;
            return (
              <tr
                key={emp.id}
                className={`${!emp.active ? "opacity-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-yellow-50/40 transition-colors`}
              >
                <td className="px-4 py-3 text-gray-400 border-b border-gray-100">{emp.rotationOrder}</td>
                <td className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{emp.name}</span>
                    {prefBadge && (
                      <span data-testid={`badge-pref-${emp.id}`} className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${prefBadge.classes}`}>
                        {prefBadge.label}
                      </span>
                    )}
                    {!emp.active && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">Inactivo</span>
                    )}
                  </div>
                </td>
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
                    {emp.active ? (
                      <>
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
                        <button
                          onClick={() => onDeactivate(emp)}
                          data-testid={`btn-deactivate-${emp.id}`}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Desactivar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onHistory(emp)}
                          data-testid={`btn-history-${emp.id}`}
                          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Historial
                        </button>
                        <button
                          onClick={() => onReactivate(emp.id)}
                          data-testid={`btn-reactivate-${emp.id}`}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Reactivar
                        </button>
                      </>
                    )}
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
