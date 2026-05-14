/**
 * Configuración centralizada para los tests E2E.
 * Todos los valores se leen de variables de entorno (.env.test).
 * Nunca hay credenciales ni URLs hardcodeadas en los specs.
 */

/** Credenciales y datos de los usuarios de prueba */
export const USERS = {
  admin: {
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  },
  tech: {
    email: process.env.TECH_EMAIL ?? "",
    password: process.env.TECH_PASSWORD ?? "",
  },
  pm: {
    email: process.env.PM_EMAIL ?? "",
    password: process.env.PM_PASSWORD ?? "",
  },
} as const;

/**
 * Colores CSS de cada tipo de turno (rgb).
 * Fuente de verdad: lib/constants/shift-colors.ts
 */
export const SHIFT_COLORS = {
  M: "rgb(255, 152, 0)",   // #FF9800 — Mañana
  T: "rgb(33, 150, 243)",  // #2196F3 — Tarde
  N: "rgb(76, 175, 80)",   // #4CAF50 — Noche
  J: "rgb(255, 193, 7)",   // #FFC107 — Jornada normal
  D: "rgb(245, 245, 245)", // #F5F5F5 — Descanso
  V: "rgb(33, 33, 33)",    // #212121 — Vacaciones
  B: "rgb(55, 71, 79)",    // #37474F — Baja
} as const;

/** Rutas de la aplicación */
export const ROUTES = {
  home: "/",
  login: "/login",
  employees: "/employees",
  projects: "/projects",
  info: "/info",
  holidays: "/holidays",
} as const;
