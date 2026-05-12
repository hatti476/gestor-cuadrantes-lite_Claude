"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useToast } from "@/components/ui/toast-provider";
import { Project, ProjectDetail, ProjectMember } from "@/lib/projects/types";

// ---------------------------------------------------------------------------
// Formulario de proyecto (crear / editar)
// ---------------------------------------------------------------------------
function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Project>;
  onSave: (data: { name: string; description: string; region: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, description, region });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="proj-name">
          Nombre *
        </label>
        <input
          id="proj-name"
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          placeholder="Nombre del proyecto"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="proj-description">
          Descripción
        </label>
        <textarea
          id="proj-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none"
          placeholder="Descripción opcional"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="proj-region">
          Región (CCAA)
        </label>
        <input
          id="proj-region"
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          placeholder="p.ej. Madrid, Cataluña..."
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Panel de miembros de un proyecto
// ---------------------------------------------------------------------------
function MembersPanel({
  project,
  onClose,
}: {
  project: ProjectDetail;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<ProjectMember[]>(project.members ?? []);
  const [allUsers, setAllUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"PROJECT_ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => (r.ok ? r.json() : []))
      .then((emps: { userId: string; user: { id: string; email: string } }[]) => {
        setAllUsers(emps.map((e) => ({ id: e.user.id, email: e.user.email })));
      })
      .catch(() => {});
  }, []);

  async function handleAdd() {
    if (!selectedUserId) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
    });
    if (res.ok) {
      const newMember: ProjectMember = await res.json();
      setMembers((prev) => {
        const existing = prev.findIndex((m) => m.userId === newMember.userId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newMember;
          return updated;
        }
        return [...prev, newMember];
      });
      setSelectedUserId("");
      showToast("Miembro añadido", "success");
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Error al añadir miembro", "error");
    }
    setAdding(false);
  }

  async function handleRemove(userId: string) {
    const res = await fetch(`/api/projects/${project.id}/members/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      showToast("Miembro eliminado", "success");
    } else {
      showToast("Error al eliminar miembro", "error");
    }
  }

  const nonMembers = allUsers.filter((u) => !members.some((m) => m.userId === u.id));

  return (
    <div
      data-testid="members-panel"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Miembros — {project.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Lista de miembros */}
        <div className="mb-4 divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Sin miembros asignados</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                data-testid="member-row"
                className="flex items-center justify-between py-2"
              >
                <div>
                  <span className="text-sm text-gray-700">{m.user.email}</span>
                  <span
                    className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      m.role === "PROJECT_ADMIN"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(m.userId)}
                  className="text-xs text-red-500 hover:text-red-700"
                  data-testid="btn-remove-member"
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Añadir miembro */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          <div className="flex gap-2">
            <select
              data-testid="member-user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="">Seleccionar usuario...</option>
              {nonMembers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
            <select
              data-testid="member-role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as "PROJECT_ADMIN" | "EMPLOYEE")}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
            </select>
          </div>
          <button
            data-testid="btn-add-member"
            onClick={handleAdd}
            disabled={!selectedUserId || adding}
            className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {adding ? "Añadiendo..." : "Añadir miembro"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel de orden de rotación nocturna
// ---------------------------------------------------------------------------
interface EmployeeBasic {
  id: string;
  name: string;
  rotationOrder: number;
}

function NightRotationPanel({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [employees, setEmployees] = useState<EmployeeBasic[]>([]);
  const [order, setOrder] = useState<EmployeeBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`/api/employees?projectId=${project.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((emps: EmployeeBasic[]) => {
        setEmployees(emps);
        // Aplicar nightRotationOrder existente si hay
        if (project.nightRotationOrder) {
          try {
            const ids: string[] = JSON.parse(project.nightRotationOrder);
            const sorted: EmployeeBasic[] = [];
            for (const id of ids) {
              const e = emps.find((x) => x.id === id);
              if (e) sorted.push(e);
            }
            // Añadir al final los que no estaban en el orden guardado
            for (const e of emps) {
              if (!sorted.some((s) => s.id === e.id)) sorted.push(e);
            }
            setOrder(sorted);
          } catch {
            setOrder([...emps].sort((a, b) => a.rotationOrder - b.rotationOrder));
          }
        } else {
          setOrder([...emps].sort((a, b) => a.rotationOrder - b.rotationOrder));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project.id, project.nightRotationOrder]);

  function move(idx: number, dir: -1 | 1) {
    const newOrder = [...order];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setOrder(newOrder);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nightRotationOrder: JSON.stringify(order.map((e) => e.id)),
      }),
    });
    if (res.ok) {
      showToast("Orden de rotación guardado", "success");
      onSaved();
      onClose();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Error al guardar", "error");
    }
    setSaving(false);
  }

  return (
    <div
      data-testid="night-rotation-panel"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Rotación nocturna — {project.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          ⚠️ Cambiar el orden afectará a la generación de cuadrantes futuros.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Cargando empleados...</p>
        ) : order.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Sin empleados activos en este proyecto</p>
        ) : (
          <ol className="divide-y divide-gray-100 mb-4" data-testid="rotation-order-list">
            {order.map((emp, idx) => (
              <li
                key={emp.id}
                data-testid={`rotation-item-${emp.id}`}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-gray-700">
                  <span className="text-gray-400 mr-2 font-mono">{idx + 1}.</span>
                  {emp.name}
                </span>
                <div className="flex gap-1">
                  <button
                    data-testid={`btn-rotation-up-${emp.id}`}
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-25 rounded hover:bg-gray-100"
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    data-testid={`btn-rotation-down-${emp.id}`}
                    onClick={() => move(idx, 1)}
                    disabled={idx === order.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-25 rounded hover:bg-gray-100"
                    title="Bajar"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="flex gap-2 justify-end border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            data-testid="btn-save-rotation-order"
            onClick={handleSave}
            disabled={saving || loading || order.length === 0}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar orden"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal /projects
// ---------------------------------------------------------------------------
export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  // PROJECT_ADMIN en al menos un proyecto también puede acceder a /projects
  const isProjectAdmin = session?.user?.projectMemberships?.some(
    (m) => m.role === "PROJECT_ADMIN"
  ) ?? false;
  const canAccess = isSuperAdmin || isProjectAdmin;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario crear/editar
  const [formMode, setFormMode] = useState<"none" | "create" | "edit">("none");
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Panel de miembros
  const [memberProject, setMemberProject] = useState<ProjectDetail | null>(null);

  // Panel de rotación nocturna
  const [rotationProject, setRotationProject] = useState<ProjectDetail | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Leer proyecto activo desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem("activeProject");
      if (stored) setSelectedProjectId((JSON.parse(stored) as { id: string }).id ?? null);
    } catch {}
  }, []);

  function handleSelectProject(p: Project) {
    localStorage.setItem("activeProject", JSON.stringify({ id: p.id, name: p.name }));
    window.dispatchEvent(new Event("activeProjectChanged"));
    setSelectedProjectId(p.id);
    router.push("/");
  }

  // Redirigir si no tiene acceso de gestión
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !canAccess) router.push("/");
  }, [status, canAccess, router]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreate(data: { name: string; description: string; region: string }) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showToast("Proyecto creado", "success");
      setFormMode("none");
      await loadProjects();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Error al crear proyecto", "error");
    }
  }

  async function handleEdit(data: { name: string; description: string; region: string }) {
    if (!editingProject) return;
    const res = await fetch(`/api/projects/${editingProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showToast("Proyecto actualizado", "success");
      setFormMode("none");
      setEditingProject(null);
      await loadProjects();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Error al actualizar", "error");
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Proyecto eliminado", "success");
      await loadProjects();
    } else {
      showToast("Error al eliminar proyecto", "error");
    }
  }

  async function handleOpenMembers(project: Project) {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const detail: ProjectDetail = await res.json();
      setMemberProject(detail);
    } else {
      showToast("Error al cargar miembros", "error");
    }
  }

  async function handleOpenRotation(project: Project) {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const detail: ProjectDetail = await res.json();
      setRotationProject(detail);
    } else {
      showToast("Error al cargar proyecto", "error");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center text-gray-400">
          Cargando...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Proyectos</h2>
          {isSuperAdmin && formMode === "none" && (
            <button
              data-testid="btn-new-project"
              onClick={() => { setEditingProject(null); setFormMode("create"); }}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Nuevo proyecto
            </button>
          )}
        </div>

        {/* Formulario crear/editar */}
        {formMode !== "none" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              {formMode === "create" ? "Nuevo proyecto" : `Editar — ${editingProject?.name}`}
            </h3>
            <ProjectForm
              initial={formMode === "edit" ? (editingProject ?? undefined) : undefined}
              onSave={formMode === "create" ? handleCreate : handleEdit}
              onCancel={() => { setFormMode("none"); setEditingProject(null); }}
            />
          </div>
        )}

        {/* Tabla de proyectos */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <span className="text-4xl">📁</span>
              <p className="text-sm">No hay proyectos creados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="projects-table">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium">Descripción</th>
                    <th className="px-4 py-3 text-left font-medium">Región</th>
                    <th className="px-4 py-3 text-center font-medium">Miembros</th>
                    <th className="px-4 py-3 text-center font-medium">Empleados</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.map((p) => (
                    <tr key={p.id} data-testid="project-row" className={selectedProjectId === p.id ? "bg-green-50" : ""}>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.region ?? "—"}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {p._count?.members ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {p._count?.employees ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <button
                            data-testid="btn-select-project"
                            onClick={() => handleSelectProject(p)}
                            className={`text-xs px-2 py-1 rounded border font-medium ${
                              selectedProjectId === p.id
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-green-300 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {selectedProjectId === p.id ? "✓ Activo" : "Seleccionar"}
                          </button>
                          <button
                            data-testid="btn-manage-members"
                            onClick={() => handleOpenMembers(p)}
                            className="text-xs px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          >
                            Miembros
                          </button>
                          <button
                            data-testid="btn-rotation-order"
                            onClick={() => handleOpenRotation(p)}
                            className="text-xs px-2 py-1 rounded border border-violet-200 text-violet-700 hover:bg-violet-50"
                          >
                            Rotación
                          </button>
                          {isSuperAdmin && (
                            <>
                              <button
                                data-testid="btn-edit-project"
                                onClick={() => { setEditingProject(p); setFormMode("edit"); }}
                                className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                              >
                                Editar
                              </button>
                              <button
                                data-testid="btn-delete-project"
                                onClick={() => handleDelete(p)}
                                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Panel de miembros */}
      {memberProject && (
        <MembersPanel
          project={memberProject}
          onClose={() => setMemberProject(null)}
        />
      )}

      {/* Panel de rotación nocturna */}
      {rotationProject && (
        <NightRotationPanel
          project={rotationProject}
          onClose={() => setRotationProject(null)}
          onSaved={loadProjects}
        />
      )}
    </div>
  );
}
