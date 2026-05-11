"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-gray-800">Gestor de Cuadrantes</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            Cuadrante
          </Link>
          {isAdmin && (
            <Link href="/employees" className="text-gray-600 hover:text-gray-900 transition-colors">
              Empleados
            </Link>
          )}
          {isAdmin && (
            <Link href="/projects" className="text-gray-600 hover:text-gray-900 transition-colors">
              Proyectos
            </Link>
          )}
          <Link href="/info" className="text-gray-600 hover:text-gray-900 transition-colors">
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
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  session.user.role === "SUPER_ADMIN"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {session.user.role}
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
