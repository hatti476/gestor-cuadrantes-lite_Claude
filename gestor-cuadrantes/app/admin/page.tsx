"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useToast } from "@/components/ui/toast-provider";
import { type Project, type ProjectMember } from "@/lib/projects/types";

interface ProjectAssignment {
  projectId: string;
  role: string;
  project: { id: string; name: string };
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  employee: {
    id: string;
    name: string;
    rotationOrder: number;
    shiftPreference: string | null;
    projectId: string | null;
    active: boolean;
    project: { id: string; name: string } | null;
  } | null;
  projectMembers: ProjectAssignment[];
}

const GLOBAL_ROLE_BADGES: Record<string, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: "SUPER_ADMIN", cls: "bg-red-100 text-red-700" },
  SUPER_VIEWER: { label: "SUPER_VIEWER", cls: "bg-gray-200 text-gray-600" },
  USER: { label: "USER", cls: "bg-blue-100 text-blue-700" },
};

const PROJECT_ROLE_LABELS: Record<string, string> = {
  PROJECT_ADMIN: "Admin",
  EMPLOYEE: "Employee",
};

const SHIFT_PREF_OPTIONS = [
  { value: "", label: "Sin preferencia" },
  { value: "M", label: "Mañanas" },
  { value: "T", label: "Tardes" },
  { value: "J", label: "Jornada" },
];

function PasswordModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Error");
      showToast("Contraseña actualizada", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Cambiar contraseña</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
        <p className="text-xs text-gray-500">{user.email}</p>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserModal({
  user, projects, onClose, onSaved,
}: {
  user: AdminUser | null; projects: Project[]; onClose: () => void; onSaved: () => void;
}) {
  const { showToast } = useToast();
  const isEdit = user !== null;
  const [name, setName] = useState(user?.employee?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [globalRole, setGlobalRole] = useState(user?.role ?? "USER");
  const [shiftPref, setShiftPref] = useState(user?.employee?.shiftPreference ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [assignments, setAssignments] = useState<{ projectId: string; role: string }[]>(
    user?.projectMembers.map((m) => ({ projectId: m.projectId, role: m.role })) ?? []
  );
  const [pendingRole, setPendingRole] = useState<Record<string, string>>({});
  const isActive = user?.employee?.active ?? true;

  function getAsgn(pId: string) { return assignments.find((a) => a.projectId === pId); }
  function addProj(pId: string) {
    if (!getAsgn(pId)) setAssignments((p) => [...p, { projectId: pId, role: pendingRole[pId] ?? "EMPLOYEE" }]);
  }
  function removeProj(pId: string) {
    setAssignments((p) => p.filter((a) => a.projectId !== pId));
    setPendingRole((p) => { const n = { ...p }; delete n[pId]; return n; });
  }
  function changeRole(pId: string, r: string) {
    setAssignments((p) => p.map((a) => a.projectId === pId ? { ...a, role: r } : a));
  }

  async function handleDeactivate() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !isActive }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Error");
      showToast(isActive ? "Usuario desactivado" : "Usuario reactivado", "success");
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); setConfirmDeactivate(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (isEdit) {
        const body: Record<string, unknown> = { email, globalRole };
        if (user?.employee) {
          body.name = name;
          body.shiftPreference = shiftPref || null;
          const newIds = new Set(assignments.map((a) => a.projectId));
          const toRemove = (user.projectMembers ?? [])
            .filter((m) => !newIds.has(m.projectId))
            .map((m) => ({ projectId: m.projectId, role: null }));
          body.projectAssignments = [...assignments, ...toRemove];
        }
        const res = await fetch(`/api/admin/users/${user!.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Error actualizando");
        showToast("Usuario actualizado", "success");
      } else {
        const body: Record<string, unknown> = { name, email, password, globalRole };
        if (globalRole === "USER") { body.shiftPreference = shiftPref || null; body.projectAssignments = assignments; }
        const res = await fetch("/api/admin/users", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Error creando");
        showToast("Usuario creado", "success");
      }
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg flex flex-col gap-5 my-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-lg">{isEdit ? `Editar — ${user?.employee?.name ?? user?.email}` : "Nuevo usuario"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Cerrar">×</button>
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Datos de acceso</h4>
              <div className="flex flex-col gap-3">
                {globalRole === "USER" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Nombre completo"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="usuario@dominio.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                {!isEdit && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña *</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mín. 8 chars, 1 mayúscula, 1 número"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                )}
                {isEdit && (
                  <button type="button" onClick={() => setShowPasswordModal(true)} className="text-sm text-blue-600 hover:text-blue-800 self-start">
                    Cambiar contraseña →
                  </button>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rol global *</label>
                  <select value={globalRole} onChange={(e) => setGlobalRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="SUPER_VIEWER">SUPER_VIEWER</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
              </div>
            </section>
            {globalRole === "USER" && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Preferencias de turno</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Preferencia de turno</label>
                  <select value={shiftPref} onChange={(e) => setShiftPref(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    {SHIFT_PREF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </section>
            )}
            {globalRole === "USER" && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Asignación a proyectos</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Proyecto</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Rol</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((proj) => {
                        const asgn = getAsgn(proj.id);
                        return (
                          <tr key={proj.id} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700 text-xs">{proj.name}</td>
                            <td className="px-3 py-2">
                              {asgn ? (
                                <select value={asgn.role} onChange={(e) => changeRole(proj.id, e.target.value)}
                                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none">
                                  <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
                                  <option value="EMPLOYEE">EMPLOYEE</option>
                                </select>
                              ) : (
                                <select value={pendingRole[proj.id] ?? "EMPLOYEE"}
                                  onChange={(e) => setPendingRole((p) => ({ ...p, [proj.id]: e.target.value }))}
                                  className="border border-gray-100 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none">
                                  <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
                                  <option value="EMPLOYEE">EMPLOYEE</option>
                                </select>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {asgn ? (
                                <button type="button" onClick={() => removeProj(proj.id)}
                                  className="text-xs text-red-600 hover:text-red-800 border border-red-200 rounded px-2 py-0.5">✕ Quitar</button>
                              ) : (
                                <button type="button" onClick={() => addProj(proj.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5">+ Añadir</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              {isEdit ? (
                confirmDeactivate ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">¿Confirmar {isActive ? "desactivar" : "reactivar"}?</span>
                    <button type="button" onClick={handleDeactivate} disabled={saving}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Sí</button>
                    <button type="button" onClick={() => setConfirmDeactivate(false)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600">No</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDeactivate(true)}
                    className={`text-xs px-3 py-1.5 rounded border ${isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                    {isActive ? "Desactivar usuario" : "Reactivar usuario"}
                  </button>
                )
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {showPasswordModal && user && <PasswordModal user={user} onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}

function UsersTab({ projects }: { projects: Project[] }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingUser, setEditingUser] = useState<AdminUser | null | "new">(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Error cargando usuarios");
      setUsers(await res.json());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const nm = u.employee?.name ?? "";
    const matchSearch = nm.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" && u.employee?.active !== false) || (statusFilter === "INACTIVE" && u.employee?.active === false);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" placeholder="Buscar por nombre o email…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-64" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="ALL">Todos los roles</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="SUPER_VIEWER">SUPER_VIEWER</option>
          <option value="USER">USER</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
        <div className="ml-auto">
          <button onClick={() => setEditingUser("new")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            + Nuevo usuario
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Cargando usuarios…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Rol global</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Proyectos</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200">Estado</th>
                <th className="px-4 py-3 border-b border-gray-200" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No hay usuarios que coincidan.</td></tr>
              ) : filtered.map((u) => {
                const badge = GLOBAL_ROLE_BADGES[u.role] ?? { label: u.role, cls: "bg-gray-100 text-gray-600" };
                const isActive = u.employee?.active !== false;
                return (
                  <tr key={u.id} className={`${!isActive ? "opacity-60" : ""} hover:bg-yellow-50/30 transition-colors border-b border-gray-100`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.employee?.name ?? <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span></td>
                    <td className="px-4 py-3">
                      {u.projectMembers.length === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">Sin proyecto</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.projectMembers.map((m) => (
                            <span key={m.projectId} data-testid={`project-chip-${u.id}-${m.projectId}`}
                              className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {m.project.name} ({PROJECT_ROLE_LABELS[m.role] ?? m.role})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.employee ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditingUser(u)} className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editingUser !== null && (
        <UserModal user={editingUser === "new" ? null : editingUser} projects={projects}
          onClose={() => setEditingUser(null)} onSaved={() => { void loadUsers(); }} />
      )}
    </div>
  );
}

function ProjectFormModal({
  initial, onSave, onCancel,
}: {
  initial: Partial<Project>;
  onSave: (d: { name: string; description: string; region: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [region, setRegion] = useState(initial.region ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    try { await onSave({ name, description, region }); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-96 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{initial.id ? "Editar proyecto" : "Nuevo proyecto"}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Región (CCAA)</label>
            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="p. ej. Madrid"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onCancel} className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectsTab() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, ProjectMember[]>>({});
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [addMemberState, setAddMemberState] = useState<{ projectId: string; userId: string; role: string } | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Error cargando proyectos");
      setProjects(await res.json());
    } catch (err) { showToast(err instanceof Error ? err.message : "Error", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  const loadAllUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setAllUsers(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadProjects(); void loadAllUsers(); }, [loadProjects, loadAllUsers]);

  async function loadMembers(projectId: string) {
    setMembersLoading((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) throw new Error();
      const data: ProjectMember[] = await res.json();
      setMembers((prev) => ({ ...prev, [projectId]: data }));
    } catch { showToast("Error cargando miembros", "error"); }
    finally { setMembersLoading((prev) => ({ ...prev, [projectId]: false })); }
  }

  function handleToggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!members[id]) void loadMembers(id);
  }

  async function handleSaveProject(data: { name: string; description: string; region: string }) {
    const isEdit = formMode === "edit" && editingProject?.id;
    const res = await fetch(isEdit ? `/api/projects/${editingProject!.id}` : "/api/projects", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Error");
    showToast(isEdit ? "Proyecto actualizado" : "Proyecto creado", "success");
    setFormMode(null); setEditingProject(null);
    await loadProjects();
  }

  async function handleDeleteProject(p: Project) {
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    if (!res.ok) { showToast("Error eliminando proyecto", "error"); return; }
    showToast("Proyecto eliminado", "success");
    setConfirmDelete(null);
    await loadProjects();
  }

  async function handleRemoveMember(projectId: string, userId: string) {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
    if (!res.ok) { showToast("Error eliminando miembro", "error"); return; }
    showToast("Miembro eliminado", "success");
    await loadMembers(projectId);
  }

  async function handleAddMember() {
    if (!addMemberState) return;
    const { projectId, userId, role } = addMemberState;
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) {
      showToast(((await res.json()) as { error?: string }).error ?? "Error añadiendo miembro", "error"); return;
    }
    showToast("Miembro añadido", "success");
    setAddMemberState(null);
    await loadMembers(projectId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => { setFormMode("create"); setEditingProject({}); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Nuevo proyecto</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Cargando proyectos…</div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer" onClick={() => handleToggleExpand(p.id)}>
                <span className="text-gray-400 text-xs">{expandedId === p.id ? "▼" : "▶"}</span>
                <span className="font-medium text-gray-800 flex-1">{p.name}</span>
                {p.region && <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600 border border-indigo-200">{p.region}</span>}
                <span className="text-xs text-gray-400">{p._count?.members ?? 0} miembros</span>
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString("es-ES")}</span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditingProject(p); setFormMode("edit"); }} data-testid="btn-edit-project"
                    className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Editar</button>
                  <button onClick={() => setConfirmDelete(p)} data-testid="btn-delete-project"
                    className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              </div>
              {expandedId === p.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  {membersLoading[p.id] ? <p className="text-sm text-gray-400">Cargando…</p> : (
                    <>
                      <table className="w-full text-xs mb-3">
                        <thead><tr className="text-gray-500">
                          <th className="text-left py-1 pr-3">Email</th>
                          <th className="text-left py-1 pr-3">Rol global</th>
                          <th className="text-left py-1 pr-3">Rol proyecto</th>
                          <th />
                        </tr></thead>
                        <tbody>
                          {(members[p.id] ?? []).length === 0 ? (
                            <tr><td colSpan={4} className="py-3 text-gray-400 text-center">Sin miembros</td></tr>
                          ) : (members[p.id] ?? []).map((m) => {
                            const b = GLOBAL_ROLE_BADGES[m.user.role] ?? { label: m.user.role, cls: "bg-gray-100 text-gray-600" };
                            return (
                              <tr key={m.userId} className="border-t border-gray-100">
                                <td className="py-2 pr-3 text-gray-600">{m.user.email}</td>
                                <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.cls}`}>{b.label}</span></td>
                                <td className="py-2 pr-3 text-gray-600">{m.role}</td>
                                <td className="py-2 text-right">
                                  <button onClick={() => handleRemoveMember(p.id, m.userId)}
                                    className="text-xs text-red-600 hover:text-red-800 border border-red-200 rounded px-2 py-0.5">✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {addMemberState?.projectId === p.id ? (
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <select value={addMemberState.userId} onChange={(e) => setAddMemberState({ ...addMemberState, userId: e.target.value })}
                            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none">
                            <option value="">— Usuario —</option>
                            {allUsers.filter((u) => u.role === "USER" && !(members[p.id] ?? []).some((m) => m.userId === u.id))
                              .map((u) => <option key={u.id} value={u.id}>{u.employee?.name ?? u.email}</option>)}
                          </select>
                          <select value={addMemberState.role} onChange={(e) => setAddMemberState({ ...addMemberState, role: e.target.value })}
                            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none">
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
                          </select>
                          <button onClick={() => void handleAddMember()} disabled={!addMemberState.userId}
                            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Añadir</button>
                          <button onClick={() => setAddMemberState(null)} className="text-sm px-3 py-1 border border-gray-200 rounded text-gray-600">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddMemberState({ projectId: p.id, userId: "", role: "EMPLOYEE" })}
                          className="text-sm text-blue-600 hover:text-blue-800 mt-1">+ Añadir miembro</button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {formMode && editingProject !== null && (
        <ProjectFormModal initial={editingProject} onSave={handleSaveProject} onCancel={() => { setFormMode(null); setEditingProject(null); }} />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <h3 className="font-semibold text-gray-800">¿Eliminar proyecto?</h3>
            <p className="text-sm text-gray-600">Esto eliminará <strong>{confirmDelete.name}</strong>. No se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600">Cancelar</button>
              <button onClick={() => void handleDeleteProject(confirmDelete)} className="text-sm px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "projects">("users");
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "SUPER_ADMIN") router.replace("/");
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user.role !== "SUPER_ADMIN") return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d: unknown) => setProjects(Array.isArray(d) ? (d as Project[]) : []))
      .catch(() => undefined);
  }, [session]);

  if (status === "loading" || session?.user.role !== "SUPER_ADMIN") return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Administración</h2>
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button onClick={() => setActiveTab("users")} data-testid="admin-tab-users"
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "users" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            Usuarios
          </button>
          <button onClick={() => setActiveTab("projects")} data-testid="admin-tab-projects"
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "projects" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            Proyectos
          </button>
        </div>
        {activeTab === "users" ? <UsersTab projects={projects} /> : <ProjectsTab />}
      </main>
    </div>
  );
}
