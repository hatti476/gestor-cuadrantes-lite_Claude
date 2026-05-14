"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";

// Secciones exclusivas para SUPER_ADMIN y PROJECT_ADMIN
const ADMIN_SECTIONS = [
  {
    title: "Gestión de proyectos",
    icon: "📁",
    items: [
      "Accede a «Proyectos» desde la barra de navegación para crear y gestionar proyectos.",
      "Selecciona un proyecto como activo pulsando «Seleccionar» — el cuadrante principal mostrará los datos de ese proyecto.",
      "Pulsa «Miembros» para añadir o eliminar usuarios del proyecto y asignarles el rol PROJECT_ADMIN o EMPLOYEE.",
      "Configura la región (CCAA) del proyecto en el botón «Editar» para activar la carga automática de festivos públicos.",
      "Pulsa «Rotación» para reordenar el turno de noches de los técnicos con los botones ↑ y ↓.",
    ],
  },
  {
    title: "Preparar el cuadrante (4 pasos)",
    icon: "⚙️",
    items: [
      "1. Vacaciones — Haz clic en las celdas del grid para marcar días de vacaciones (V). Quedan bloqueados y no se sobreescriben al generar.",
      "2. Días libres — Haz clic en celdas para marcar descansos excepcionales (D). También quedan bloqueados.",
      "3. Festivos — Revisa los festivos del mes. Usa «Cargar festivos automáticamente» si el proyecto tiene región configurada, o gestiónalos manualmente desde «Gestionar festivos del mes».",
      "4. Generar — Pulsa «Guardar preparación» para conservar el estado actual y luego «Generar cuadrante» para aplicar la rotación automática sobre los días no bloqueados.",
      "Puedes reabrir cualquier paso pulsando sobre él en el panel lateral derecho.",
    ],
  },
  {
    title: "Festivos automáticos",
    icon: "🎉",
    items: [
      "Configura la región (CCAA) del proyecto en «Proyectos → Editar» para activar la función de carga automática.",
      "En el Paso 3 del panel de preparación, pulsa «Cargar festivos automáticamente» para importar los festivos públicos nacionales y de tu CCAA desde la API de nager.at.",
      "Los festivos importados se añaden a la lista y son editables y eliminables manualmente.",
      "Si la API externa no responde, aparece un aviso y puedes continuar añadiendo los festivos a mano desde «Gestionar festivos del mes».",
      "Al añadir un festivo, los turnos M y T de ese día se convierten en MF y TF. El turno N del día anterior pasa a ser NF.",
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
      "N  — Noche             (23:00–07:00)  · Color azul oscuro",
      "J  — Jornada normal    (09:00–18:00 L-V)  · Color verde",
      "D  — Descanso          —  · Color gris claro",
      "V  — Vacaciones        —  · Color verde claro",
      "B  — Baja              —  · Color rosa",
      "MF — Mañana en festivo (07:00–15:00)  · Color naranja oscuro",
      "TF — Tarde en festivo  (15:00–23:00)  · Color azul oscuro",
      "NF — Noche en festivo  (23:00–07:00)  · Color índigo",
    ],
  },
  {
    title: "Cómo leer el cuadrante",
    icon: "📋",
    items: [
      "El grid muestra filas de empleados y columnas de días del mes. Cada celda contiene el código de turno asignado.",
      "El badge de estado del mes (arriba a la izquierda) indica: «Sin generar», «En preparación» o «Generado».",
      "Los días festivos tienen la cabecera en rojo. Pasa el cursor sobre ellos para ver el nombre del festivo.",
      "La tabla de contadores bajo el grid muestra cuántos turnos M, T, N, D, V, B tiene cada empleado en el mes.",
      "Navega entre meses con los botones ‹ y › situados junto al nombre del mes.",
    ],
  },
];

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
  const isProjectAdmin = (session?.user?.projectMemberships ?? []).some(
    (m: { role: string }) => m.role === "PROJECT_ADMIN"
  );
  const isAdmin = isSuperAdmin || isProjectAdmin;
  const isEmployee = !isSuperAdmin && !isProjectAdmin;

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isProjectAdmin
    ? "Project Admin"
    : "Técnico";

  // Construir secciones según rol
  const sections = [
    ...(isAdmin ? ADMIN_SECTIONS : []),
    ...COMMON_SECTIONS,
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
