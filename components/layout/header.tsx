"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { isAdmin, isTecnico, isViewer } from "@/lib/auth/permissions";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Usar las nuevas funciones de permisos
  const admin = isAdmin(session);
  const tecnico = isTecnico(session);
  const viewer = isViewer(session);
  const canManage = admin; // Solo ADMIN puede gestionar

  // Admin ve /admin, /employees, /holidays
  // TECNICO y VIEWER solo ven / (cuadrante) y /info

  const [loggingOut, setLoggingOut] = useState(false);

  function navClass(href: string) {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return isActive
      ? "text-indigo-600 font-semibold border-b-2 border-indigo-500 pb-0.5 transition-colors"
      : "text-gray-500 hover:text-gray-900 transition-colors";
  }

  async function handleSignOut() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const data = await signOut({ redirect: false, callbackUrl: "/login" });
      router.push(data?.url ?? "/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  // Determinar label del rol
  const roleLabel = admin ? "Admin" : tecnico ? "Técnico" : viewer ? "Viewer" : session?.user?.role ?? "—";

  // Color del badge
  const roleBadgeClass = admin
    ? "bg-blue-100 text-blue-700"
    : tecnico
    ? "bg-green-100 text-green-700"
    : viewer
    ? "bg-gray-200 text-gray-600"
    : "bg-gray-100 text-gray-600";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-gray-800">Gestor de Cuadrantes</h1>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className={navClass("/")}>
            Cuadrante
          </Link>
          {canManage && (
            <Link href="/employees" className={navClass("/employees")}>
              Empleados
            </Link>
          )}
          {canManage && (
            <Link href="/holidays" className={navClass("/holidays")}>
              Festivos
            </Link>
          )}
          {canManage && (
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
        {session?.user && (
          <>
            <span className="text-sm text-gray-600">
              {session.user.email}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleBadgeClass}`}
                data-testid="role-badge"
              >
                {roleLabel}
              </span>
            </span>
            <button
              onClick={() => void handleSignOut()}
              disabled={loggingOut}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-60"
            >
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </>
        )}
      </div>
    </header>
  );
}