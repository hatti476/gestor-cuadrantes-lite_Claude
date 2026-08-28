"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/projects/types";

interface Props {
  /** ID del proyecto actualmente seleccionado */
  activeProjectId: string | null;
  onChange: (projectId: string | null) => void;
  /** Si es SUPER_ADMIN puede ver "todos" */
  isSuperAdmin: boolean;
}

export function ProjectSelector({ activeProjectId, onChange, isSuperAdmin }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Project[]) => {
        setProjects(data);
        // Si no hay proyecto activo y hay proyectos disponibles, seleccionar el primero
        if (!activeProjectId && data.length > 0) {
          onChange(data[0].id);
        }
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;
  if (projects.length === 0) return null;
  if (projects.length === 1 && !isSuperAdmin) {
    // Un solo proyecto y no es admin → mostrar solo el nombre sin selector
    return (
      <span
        data-testid="project-name-badge"
        className="text-xs px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 font-medium"
      >
        {projects[0].name}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="project-selector" className="text-xs text-gray-500 font-medium">
        Proyecto:
      </label>
      <select
        id="project-selector"
        data-testid="project-selector"
        value={activeProjectId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
      >
        {isSuperAdmin && (
          <option value="">Todos los proyectos</option>
        )}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
