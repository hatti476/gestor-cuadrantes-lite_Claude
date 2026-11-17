/**
 * Sprint 5 (ciclo 2) — SPEC-011: el rol y el estado se revalidan en cada petición.
 */

import { test, expect } from "@playwright/test";
import { createDisposableTecnico, deleteUserByEmail, login, loginAsAdmin } from "./helpers";

test("CP-183 — TECNICO desactivado con sesión abierta pierde el acceso en su siguiente petición @smoke", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  await loginAsAdmin(page);
  const tech = await createDisposableTecnico(page);

  const techContext = await browser.newContext();
  const techPage = await techContext.newPage();
  try {
    await login(techPage, tech.email, tech.password);
    expect((await techPage.request.get("/api/holidays?year=2026")).status()).toBe(200);
    expect((await techPage.request.get("/api/schedules/snapshot?year=2026&month=5")).status()).toBe(200);

    // El ADMIN lo desactiva mientras su sesión sigue abierta
    const patch = await page.request.patch(`/api/admin/users/${tech.userId}`, { data: { active: false } });
    expect(patch.status()).toBe(200);

    // Siguiente petición a la API: ya sin permisos (antes conservaba el rol hasta 30 días)
    expect((await techPage.request.get("/api/holidays?year=2026")).status()).toBe(403);
    expect((await techPage.request.get("/api/schedules/snapshot?year=2026&month=5")).status()).toBe(403);

    // La cookie se reescribe al consultar la sesión; a partir de ahí proxy.ts lo saca
    // (la sesión sigue existiendo —mismo email— pero sin rol: no es una cookie borrada)
    const session = await (await techPage.request.get("/api/auth/session")).json();
    expect(session.user?.email).toBe(tech.email);
    expect(session.user?.role).toBeUndefined();
    await techPage.goto("/");
    await expect(techPage).toHaveURL(/\/login/);
  } finally {
    await techContext.close();
    await deleteUserByEmail(page, tech.email);
  }
});

test("CP-184 — Un cambio de rol se aplica sin volver a iniciar sesión", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await loginAsAdmin(page);
  const email = `viewer-tmp-${Date.now()}@cuadrantes.test`;
  const password = "Temporal1234!";
  const res = await page.request.post("/api/admin/users", { data: { email, password, globalRole: "VIEWER" } });
  expect(res.status()).toBe(201);
  const { id } = (await res.json()) as { id: string };

  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  try {
    await login(other, email, password);
    expect((await other.request.get("/api/admin/users")).status()).toBe(403);

    // Ascendido a ADMIN: la siguiente petición ya tiene permisos de ADMIN
    const patch = await page.request.patch(`/api/admin/users/${id}`, { data: { email, globalRole: "ADMIN" } });
    expect(patch.status()).toBe(200);
    expect((await other.request.get("/api/admin/users")).status()).toBe(200);

    // Y degradado de nuevo a VIEWER: pierde el acceso sin cerrar sesión
    const demote = await page.request.patch(`/api/admin/users/${id}`, { data: { email, globalRole: "VIEWER" } });
    expect(demote.status()).toBe(200);
    expect((await other.request.get("/api/admin/users")).status()).toBe(403);
  } finally {
    await ctx.close();
    await page.request.delete(`/api/admin/users/${id}`);
  }
});

test("CP-185 — TECNICO ascendido a ADMIN conserva el acceso (su Employee queda inactivo)", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await loginAsAdmin(page);
  const tech = await createDisposableTecnico(page);
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  try {
    await login(other, tech.email, tech.password);

    const promote = await page.request.patch(`/api/admin/users/${tech.userId}`, {
      data: { email: tech.email, globalRole: "ADMIN" },
    });
    expect(promote.status()).toBe(200);

    // Sesión abierta: pasa a tener permisos de ADMIN, no queda deshabilitada
    expect((await other.request.get("/api/admin/users")).status()).toBe(200);

    // Y puede volver a iniciar sesión
    await ctx.clearCookies();
    await login(other, tech.email, tech.password);
    await expect(other).toHaveURL(/\/$/);
  } finally {
    await ctx.close();
    await deleteUserByEmail(page, tech.email);
  }
});
