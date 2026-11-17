/**
 * SPEC-010 AC-04 — Matriz de accesos por rol.
 * Fuente de verdad: tabla "Matriz de accesos" de specs/SPEC-010-auditoria-permisos-post-refactor.md.
 *
 * Las escrituras solo se prueban con roles que deben recibir 401/403: el guard
 * corta antes de leer el body, así que estos tests no modifican datos.
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin, loginAsTech, loginAsViewer } from "./helpers";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type Role = "ADMIN" | "TECNICO" | "VIEWER";

interface Rule {
  method: Method;
  path: string;
  /** Código esperado por rol; ausente = no se prueba con ese rol (escrituras con ADMIN). */
  expect: Partial<Record<Role, number>>;
}

const FAKE_ID = "id-inexistente";
const READ_ONLY_DENIED = { TECNICO: 403, VIEWER: 403 } as const;

const RULES: Rule[] = [
  // Cuadrante
  { method: "GET", path: "/api/schedules?year=2026&month=5", expect: { ADMIN: 200, TECNICO: 200, VIEWER: 200 } },
  { method: "POST", path: "/api/schedules", expect: READ_ONLY_DENIED },
  { method: "DELETE", path: "/api/schedules?year=2026&month=5", expect: READ_ONLY_DENIED },
  { method: "POST", path: "/api/schedules/generate", expect: READ_ONLY_DENIED },
  { method: "PATCH", path: "/api/schedules/publish", expect: READ_ONLY_DENIED },
  { method: "GET", path: "/api/schedules/snapshot?year=2026&month=5", expect: { ADMIN: 200, TECNICO: 200, VIEWER: 200 } },
  { method: "POST", path: "/api/schedules/snapshot", expect: READ_ONLY_DENIED },
  { method: "POST", path: "/api/schedules/snapshot/restore", expect: READ_ONLY_DENIED },
  // Empleados
  { method: "GET", path: "/api/employees", expect: { ADMIN: 200, ...READ_ONLY_DENIED } },
  { method: "POST", path: "/api/employees", expect: READ_ONLY_DENIED },
  { method: "PATCH", path: `/api/employees/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  { method: "PUT", path: `/api/employees/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  { method: "DELETE", path: `/api/employees/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  { method: "GET", path: `/api/employees/${FAKE_ID}/history`, expect: READ_ONLY_DENIED },
  // Festivos
  { method: "GET", path: "/api/holidays?year=2026", expect: { ADMIN: 200, TECNICO: 200, VIEWER: 200 } },
  { method: "POST", path: "/api/holidays", expect: READ_ONLY_DENIED },
  { method: "DELETE", path: `/api/holidays/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  // ADMIN no se prueba: llama a nager.at (servicio externo)
  { method: "GET", path: "/api/holidays/public?year=2026", expect: READ_ONLY_DENIED },
  // Usuarios
  { method: "GET", path: "/api/admin/users", expect: { ADMIN: 200, ...READ_ONLY_DENIED } },
  { method: "POST", path: "/api/admin/users", expect: READ_ONLY_DENIED },
  { method: "PATCH", path: `/api/admin/users/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  { method: "PUT", path: `/api/admin/users/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  { method: "DELETE", path: `/api/admin/users/${FAKE_ID}`, expect: READ_ONLY_DENIED },
  { method: "POST", path: `/api/admin/users/${FAKE_ID}/rotation`, expect: READ_ONLY_DENIED },
];

const LOGIN: Record<Role, (page: Page) => Promise<void>> = {
  ADMIN: loginAsAdmin,
  TECNICO: loginAsTech,
  VIEWER: loginAsViewer,
};

async function call(page: Page, rule: Rule): Promise<number> {
  const res = await page.request.fetch(rule.path, {
    method: rule.method,
    data: rule.method === "GET" ? undefined : {},
    maxRedirects: 0,
  });
  return res.status();
}

for (const role of ["ADMIN", "TECNICO", "VIEWER"] as const) {
  test(`CP-177 — Matriz de API para ${role} @smoke`, async ({ page }) => {
    await LOGIN[role](page);

    const mismatches: string[] = [];
    for (const rule of RULES) {
      const expected = rule.expect[role];
      if (expected === undefined) continue;
      const actual = await call(page, rule);
      if (actual !== expected) mismatches.push(`${rule.method} ${rule.path}: esperado ${expected}, recibido ${actual}`);
    }
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });
}

test("CP-178 — Sin sesión, todos los endpoints responden 401 @smoke", async ({ page }) => {
  const mismatches: string[] = [];
  for (const rule of RULES) {
    const actual = await call(page, rule);
    if (actual !== 401) mismatches.push(`${rule.method} ${rule.path}: esperado 401, recibido ${actual}`);
  }
  expect(mismatches, mismatches.join("\n")).toEqual([]);
});

test.describe("CP-179 — Páginas restringidas a ADMIN", () => {
  for (const path of ["/admin", "/holidays"]) {
    test(`ADMIN entra en ${path} @smoke`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    });

    for (const role of ["TECNICO", "VIEWER"] as const) {
      test(`${role} es redirigido a / desde ${path}`, async ({ page }) => {
        await LOGIN[role](page);
        await page.goto(path);
        await page.waitForURL((url) => url.pathname === "/");
      });
    }
  }
});
