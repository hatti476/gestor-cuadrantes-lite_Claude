"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";

const ADMIN_SECTIONS = [
  {
    title: "Gestión del cuadrante",
    icon: "📋",
    items: [
      "Navega entre meses con los botones ‹ y › del cuadrante.",
      "Haz clic sobre cualquier celda del grid para asignar o cambiar el turno de un empleado.",
      "Usa «Generar cuadrante» para rellenar automáticamente el mes con la rotación cíclica (M×5, D×2, T×5, D×2, N×5, D×2). Los turnos ya asignados manualmente no se sobreescriben.",
      "Usa «Exportar CSV» para descargar el cuadrante del mes activo en formato compatible con Excel.",
      "Usa «Imprimir» para imprimir el cuadrante o guardarlo como PDF — los controles se ocultan automáticamente.",
    ],
  },
  {
    title: "Tipos de turno",
    icon: "🕐",
    items: [
      "M — Mañana (07:00–15:00)",
      "T — Tarde (15:00–23:00)",
      "N — Noche (23:00–07:00 del día siguiente)",
      "MF / TF / NF — Igual que M/T/N pero en día festivo",
      "D — Descanso",
      "V — Vacaciones",
      "L — Libre",
      "J — Jornada especial",
      "E — Enfermedad / baja",
      "B — Formación",
    ],
  },
  {
    title: "Gestión de festivos",
    icon: "🎉",
    items: [
      "Accede a «Festivos» desde el cuadrante para añadir o eliminar días festivos por año.",
      "Al añadir un festivo, los turnos M y T de ese día se convierten automáticamente en MF y TF.",
      "El turno N del día anterior al festivo se convierte en NF (el turno de noche termina en el festivo).",
      "Al volver a generar el cuadrante, la lógica de festivos se aplica correctamente.",
      "Pulsa sobre la cabecera roja de cualquier día festivo en el grid para ver su descripción.",
    ],
  },
  {
    title: "Gestión de empleados",
    icon: "👥",
    items: [
      "Accede a «Empleados» para ver la lista de usuarios del sistema.",
      "Usa «Editar» para cambiar el nombre o rol de un empleado.",
      "Usa «Clave» para establecer una nueva contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número).",
      "Usa «Historial» para ver los últimos 20 cambios de turno de ese empleado.",
    ],
  },
  {
    title: "Notificaciones",
    icon: "🔔",
    items: [
      "Las acciones exitosas muestran un aviso verde en la esquina inferior derecha.",
      "Los errores muestran un aviso rojo. Si persiste, comprueba la conexión con el servidor.",
      "Los avisos desaparecen automáticamente en 4 segundos.",
    ],
  },
];

const EMPLOYEE_SECTIONS = [
  {
    title: "Consulta del cuadrante",
    icon: "📋",
    items: [
      "En la pantalla principal puedes ver el cuadrante mensual de todos los empleados.",
      "Navega entre meses con los botones ‹ y ›.",
      "Cada celda muestra el tipo de turno asignado para ese día.",
      "Los días festivos aparecen con la cabecera en rojo. Pulsa sobre ellos para ver el nombre del festivo.",
      "Usa «Imprimir» para imprimir el cuadrante o guardarlo como PDF.",
    ],
  },
  {
    title: "Tipos de turno",
    icon: "🕐",
    items: [
      "M — Mañana (07:00–15:00)",
      "T — Tarde (15:00–23:00)",
      "N — Noche (23:00–07:00 del día siguiente)",
      "MF / TF / NF — Igual que M/T/N pero en día festivo",
      "D — Descanso",
      "V — Vacaciones",
      "L — Libre",
      "J — Jornada especial",
      "E — Enfermedad / baja",
      "B — Formación",
    ],
  },
  {
    title: "Tu cuenta",
    icon: "👤",
    items: [
      "Tu email y rol aparecen en la cabecera superior derecha.",
      "Para cerrar sesión pulsa «Cerrar sesión» en la cabecera.",
      "Si necesitas cambiar tu contraseña, contacta con el administrador.",
    ],
  },
];

export default function InfoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") return null;

  const isAdmin = session?.user?.role === "SUPER_ADMIN";
  const sections = isAdmin ? ADMIN_SECTIONS : EMPLOYEE_SECTIONS;
  const roleLabel = isAdmin ? "Administrador" : "Técnico";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Guía de uso</h2>
          <p className="text-sm text-gray-500">
            Perfil: <span className="font-medium text-gray-700">{roleLabel}</span>
            {" — "}
            {session?.user?.email}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-xl">{section.icon}</span>
                <h3 className="font-semibold text-gray-800">{section.title}</h3>
              </div>
              <ul className="px-5 py-4 flex flex-col gap-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-blue-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
