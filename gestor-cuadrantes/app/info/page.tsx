"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";

// Secciones exclusivas para SUPER_ADMIN (usuario administrador global)
const SUPER_ADMIN_ONLY_SECTIONS = [
  {
    title: "Gestión de usuarios",
    icon: "👥",
    items: [
      "Accede a «Admin» desde la barra de navegación para gestionar cuentas de usuario.",
      "Crea cuentas SUPER_VIEWER (acceso de solo lectura a todos los proyectos) o SUPER_ADMIN desde la pestaña «Usuarios».",
      "Los usuarios con rol USER deben asociarse a un empleado existente al crearse; los roles SUPER_VIEWER y SUPER_ADMIN no requieren empleado.",
      "Desactiva una cuenta pulsando «Desactivar» — el usuario no podrá iniciar sesión pero sus datos se conservan.",
      "La pestaña «Proyectos» de la misma sección permite crear y eliminar proyectos globalmente.",
    ],
  },
];

// Secciones exclusivas para SUPER_ADMIN y PROJECT_ADMIN
const ADMIN_SECTIONS = [
  {
    title: "Gestión de proyectos",
    icon: "📁",
    items: [
      "Accede a «Proyectos» desde la barra de navegación para crear y gestionar proyectos.",
      "Selecciona un proyecto como activo pulsando «Seleccionar» — el cuadrante principal mostrará los datos de ese proyecto.",
      "Pulsa «Miembros» para añadir o eliminar usuarios del proyecto y asignarles el rol PROJECT_ADMIN o EMPLOYEE.",
      "Configura la región (CCAA) del proyecto en el botón «Editar» para activar la precarga automática de festivos públicos.",
      "Pulsa «Rotación» para reordenar el turno de noches de los técnicos con los botones ↑ y ↓.",
    ],
  },
  {
    title: "Preparar el cuadrante (5 pasos)",
    icon: "⚙️",
    items: [
      "1. Vacaciones — Haz clic en las celdas del grid para marcar días de vacaciones (V). Quedan bloqueados y no se sobreescriben al generar.",
      "2. Días libres — Haz clic en celdas para marcar descansos excepcionales (D). También quedan bloqueados.",
      "3. Bajas — Haz clic en celdas para marcar bajas (B). Quedan bloqueadas igual que vacaciones y descansos manuales.",
      "4. Festivos — Revisa los festivos precargados si el proyecto tiene región configurada, o gestiónalos manualmente desde «Gestionar festivos del mes».",
      "5. Generar — Pulsa «Guardar preparación» para conservar el estado actual y luego «Generar cuadrante» para aplicar la rotación automática sobre los días no bloqueados.",
      "6. Deshacer — Tras generar, el botón «↩ Deshacer» restaura el estado inmediatamente anterior a la última generación, útil si el resultado no es el esperado.",
      "Si un día tiene 0 o 1 empleado disponible, aparece un aviso de cobertura crítica en el panel de preparación antes de generar.",
      "Puedes reabrir cualquier paso pulsando sobre él en el panel lateral derecho.",
    ],
  },
  {
    title: "Festivos precargados",
    icon: "🎉",
    items: [
      "Configura la región (CCAA) del proyecto en «Proyectos → Editar» para activar la precarga.",
      "Al abrir un mes vacío, el sistema importa automáticamente los festivos públicos nacionales y de tu CCAA desde la API de nager.at.",
      "Los festivos importados se añaden a la lista y son editables y eliminables manualmente.",
      "Si la API externa no responde, aparece un aviso y puedes continuar añadiendo los festivos a mano desde «Gestionar festivos del mes».",
      "Al añadir un festivo, los turnos M y T de ese día se convierten en MF y TF. El turno N vinculado al festivo pasa a ser NF.",
      "Si un festivo cae pegado al fin de semana, se añade al paquete MF/TF del mismo fin de semana.",
    ],
  },
  {
    title: "Preferencias de turno",
    icon: "🔧",
    items: [
      "Sin preferencia — El algoritmo asigna M o T según la rotación equitativa del mes.",
      "Solo mañanas — El empleado recibirá turno M en los días laborables (salvo que esté en bloque de noches o descanso).",
      "Solo tardes — El empleado recibirá turno T en los días laborables.",
      "Solo jornada (J) — El empleado trabajará en horario de jornada normal (09:00–18:00 de L a V). Los fines de semana y festivos se asignan como D.",
      "Las preferencias se configuran en «Empleados → Editar» y afectan a la generación automática de todos los proyectos en que participa el empleado.",
    ],
  },
  {
    title: "Orden de rotación nocturna",
    icon: "🌙",
    items: [
      "Accede a «Proyectos → Rotación» para ver y reordenar el turno de noches de los técnicos.",
      "Usa los botones ↑ y ↓ para cambiar la posición de cada técnico en la cola.",
      "El primero de la lista entrará al bloque de noches el próximo ciclo disponible.",
      "El orden se guarda por proyecto: cada proyecto puede tener una rotación distinta.",
      "Pulsa «Guardar orden» para confirmar los cambios. El nuevo orden se aplica en la siguiente generación.",
    ],
  },
];

// Secciones comunes para todos los roles
const COMMON_SECTIONS = [
  {
    title: "Tipos de turno",
    icon: "🕐",
    items: [
      "M  — Mañana           (07:00–15:00)  · Color naranja",
      "T  — Tarde             (15:00–23:00)  · Color azul",
      "N  — Noche             (23:00–07:00)  · Color verde",
      "J  — Jornada normal    (09:00–18:00 L-V)  · Color amarillo",
      "D  — Descanso          —  · Color gris claro",
      "V  — Vacaciones        —  · Color negro",
      "B  — Baja              —  · Color gris oscuro",
      "MF — Mañana en festivo (07:00–15:00)  · Color naranja (igual que M)",
      "TF — Tarde en festivo  (15:00–23:00)  · Color azul (igual que T)",
      "NF — Noche en festivo  (23:00–07:00)  · Color verde (igual que N)",
      "MN — Mañana Navidad    (07:00–15:00)  · Color naranja (igual que M)",
      "TN — Tarde Navidad     (15:00–23:00)  · Color azul (igual que T)",
      "NN — Noche Navidad     (23:00–07:00)  · Color verde (igual que N)",
    ],
  },
  {
    title: "Resumen legal de descansos",
    icon: "⚖️",
    items: [
      "Entre el final de una jornada y el comienzo de la siguiente deben mediar al menos 12 horas de descanso.",
      "El sistema evita automáticamente transiciones con menos de 12 horas, como T→M, T→MF, N→M, N→T, NF→MF o TN→MN.",
      "Los bloques de noche incluyen descansos planificados antes y después del bloque para evitar encadenar jornadas incompatibles.",
      "Cuando un empleado acumula un bloque de trabajo, el generador intenta garantizar al menos 2 descansos consecutivos antes del siguiente bloque.",
      "Con carácter general, el descanso semanal mínimo es de día y medio ininterrumpido, acumulable por periodos de hasta 14 días.",
      "La edición manual puede mostrar una advertencia legal si el turno elegido deja menos de 12 horas con el día anterior o siguiente; el aviso informa pero no bloquea la decisión del administrador.",
    ],
  },
  {
    title: "Cómo leer el cuadrante",
    icon: "📋",
    items: [
      "El grid muestra filas de empleados y columnas de días del mes. Cada celda contiene el código de turno asignado.",
      "El badge de estado del mes (arriba a la izquierda) indica: «Sin generar», «En preparación» o «Generado».",
      "Las columnas de sábado y domingo tienen el encabezado en azul claro para distinguirlas de los días laborables.",
      "Los días festivos tienen la cabecera en rojo intenso. Pasa el cursor sobre ellos para ver el nombre del festivo.",
      "La tabla de contadores bajo el grid muestra cuántos turnos M, T, N, D, V, B tiene cada empleado en el mes.",
      "La tabla de complementos muestra el importe de los turnos MF, TF, N, NF y, en diciembre/enero, MN, TN y NN.",
      "Navega entre meses con los botones ‹ y › situados junto al nombre del mes.",
    ],
  },
];

// Sección exclusiva para SUPER_VIEWER
const VIEWER_SECTION = {
  title: "Tu acceso como Viewer",
  icon: "👁️",
  items: [
    "El rol Viewer te da acceso de solo lectura a todos los proyectos sin necesidad de membresías explícitas.",
    "Puedes ver el cuadrante de cualquier proyecto pero no puedes generar, editar turnos ni modificar la preparación.",
    "El badge «Viewer» en la cabecera identifica tu nivel de acceso.",
    "Para cambiar de proyecto, usa el selector de proyectos en la cabecera.",
  ],
};

// Sección exclusiva para EMPLOYEE
const EMPLOYEE_OWN_SHIFT_SECTION = {
  title: "Tu turno actual",
  icon: "👤",
  items: [
    "Tu fila en el cuadrante aparece resaltada con un fondo de color diferente para que la identifiques fácilmente.",
    "Desplázate horizontalmente si el mes tiene muchos días para ver todos tus turnos.",
    "Si no ves tu fila resaltada, comprueba que el proyecto activo es el correcto en la cabecera.",
  ],
};

export default function InfoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") return null;

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isSuperViewer = session?.user?.role === "SUPER_VIEWER";
  const isProjectAdmin = (session?.user?.projectMemberships ?? []).some(
    (m: { role: string }) => m.role === "PROJECT_ADMIN"
  );
  const isAdmin = isSuperAdmin || isProjectAdmin;
  const isEmployee = !isSuperAdmin && !isSuperViewer && !isProjectAdmin;

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isSuperViewer
    ? "Viewer"
    : isProjectAdmin
    ? "Project Admin"
    : "Técnico";

  // Construir secciones según rol
  const sections = [
    ...(isSuperAdmin ? SUPER_ADMIN_ONLY_SECTIONS : []),
    ...(isAdmin ? ADMIN_SECTIONS : []),
    ...COMMON_SECTIONS,
    ...(isSuperViewer ? [VIEWER_SECTION] : []),
    ...(isEmployee ? [EMPLOYEE_OWN_SHIFT_SECTION] : []),
  ];

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
                <h3 className="font-semibold text-gray-800" data-testid={`info-section-${section.title}`}>
                  {section.title}
                </h3>
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
