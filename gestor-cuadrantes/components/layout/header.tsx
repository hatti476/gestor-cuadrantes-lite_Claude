"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function getActiveProjectName(): string | null {
  try {
    const stored = localStorage.getItem("activeProject");
    return stored ? ((JSON.parse(stored) as { name: string }).name ?? null) : null;
  } catch {
    return null;
  }
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSuperViewer = role === "SUPER_VIEWER";
  const isProjectAdmin =
    session?.user?.projectMemberships?.some((m) => m.role === "PROJECT_ADMIN") ?? false;
  // Can access /projects: SUPER_ADMIN, SUPER_VIEWER, PROJECT_ADMIN
  const canAccessProjects = isSuperAdmin || isSuperViewer || isProjectAdmin;

  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

  function readActiveProject() {
    setActiveProjectName(getActiveProjectName());
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(readActiveProject, 0);
    window.addEventListener("activeProjectChanged", readActiveProject);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("activeProjectChanged", readActiveProject);
    };
  }, []);

  function navClass(href: string) {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return isActive
      ? "text-indigo-600 font-semibold border-b-2 border-indigo-500 pb-0.5 transition-colors"
      : "text-gray-500 hover:text-gray-900 transition-colors";
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-gray-800">Gestor de Cuadrantes</h1>
        <nav className="flex items-center gap-5 text-sm">
          {canAccessProjects && (
            <Link href="/projects" className={navClass("/projects")}>
              Proyectos
            </Link>
          )}
          <Link href="/" className={navClass("/")}>
            Cuadrante
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin"
              className={navClass("/admin")}
              data-testid="nav-admin"
            >
              Administración
            </Link>
          )}
          <Link href="/info" className={navClass("/info")}>
            Ayuda
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {activeProjectName && (
          <span
            data-testid="active-project-badge"
            className="text-xs px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 font-medium"
          >
            📁 {activeProjectName}
          </span>
        )}
        {session?.user && (
          <>
            <span className="text-sm text-gray-600">
              {session.user.email}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isSuperAdmin
                    ? "bg-blue-100 text-blue-700"
                    : isSuperViewer
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-100 text-gray-600"
                }`}
                data-testid="role-badge"
              >
                {isSuperViewer ? "Viewer" : role}
              </span>
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </header>
  );
}
