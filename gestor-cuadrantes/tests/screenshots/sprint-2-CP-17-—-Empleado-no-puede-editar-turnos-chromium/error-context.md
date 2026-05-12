# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint-2.spec.ts >> CP-17 — Empleado no puede editar turnos
- Location: tests/e2e/sprint-2.spec.ts:119:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - heading "Gestor de Cuadrantes" [level=1] [ref=e5]
        - navigation [ref=e6]:
          - link "Cuadrante" [ref=e7] [cursor=pointer]:
            - /url: /
          - link "Ayuda" [ref=e8] [cursor=pointer]:
            - /url: /info
      - generic [ref=e9]:
        - generic [ref=e10]: 📁 Equipo Soporte 24h
        - generic [ref=e11]: tecnico1@cuadrantes.localUSER
        - button "Cerrar sesión" [ref=e12]
    - main [ref=e13]:
      - generic [ref=e14]:
        - button "‹" [ref=e15]
        - heading "Mayo 2026" [level=2] [ref=e16]
        - button "›" [ref=e17]
        - button "Exportar CSV" [ref=e18]
        - button "Imprimir" [ref=e19]
      - generic [ref=e20]: Cargando cuadrante...
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: M
          - generic [ref=e24]: Mañana
        - generic [ref=e25]:
          - generic [ref=e26]: T
          - generic [ref=e27]: Tarde
        - generic [ref=e28]:
          - generic [ref=e29]: "N"
          - generic [ref=e30]: Noche
        - generic [ref=e31]:
          - generic [ref=e32]: J
          - generic [ref=e33]: Jornada normal
        - generic [ref=e34]:
          - generic [ref=e35]: D
          - generic [ref=e36]: Descanso
        - generic [ref=e37]:
          - generic [ref=e38]: V
          - generic [ref=e39]: Vacaciones
        - generic [ref=e40]:
          - generic [ref=e41]: B
          - generic [ref=e42]: Baja
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49]
  - alert [ref=e52]
```

# Test source

```ts
  1  | /**
  2  |  * Helpers compartidos para todos los tests E2E.
  3  |  * Importar desde aquí — no duplicar en cada spec.
  4  |  */
  5  | 
  6  | import { Page } from "@playwright/test";
  7  | import path from "path";
  8  | import fs from "fs";
  9  | import { USERS, ROUTES } from "./config";
  10 | 
  11 | /**
  12 |  * Realiza el login con las credenciales indicadas y espera la redirección a /.
  13 |  */
  14 | export async function login(
  15 |   page: Page,
  16 |   email: string,
  17 |   password: string
  18 | ): Promise<void> {
  19 |   await page.goto(ROUTES.login);
  20 |   await page.getByLabel("Email").fill(email);
  21 |   await page.getByLabel("Contraseña").fill(password);
  22 |   await page.getByRole("button", { name: "Entrar" }).click();
> 23 |   await page.waitForURL(ROUTES.home, { timeout: 10_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  24 | }
  25 | 
  26 | /** Login rápido como SUPER_ADMIN. */
  27 | export async function loginAsAdmin(page: Page): Promise<void> {
  28 |   return login(page, USERS.admin.email, USERS.admin.password);
  29 | }
  30 | 
  31 | /** Login rápido como técnico (USER). */
  32 | export async function loginAsTech(page: Page): Promise<void> {
  33 |   return login(page, USERS.tech.email, USERS.tech.password);
  34 | }
  35 | 
  36 | /** Login rápido como project manager (PM). */
  37 | export async function loginAsPM(page: Page): Promise<void> {
  38 |   return login(page, USERS.pm.email, USERS.pm.password);
  39 | }
  40 | 
  41 | /**
  42 |  * Captura un screenshot al fallar un test.
  43 |  * Se guarda en tests/screenshots/<cpId>-fail.png
  44 |  */
  45 | export async function screenshotOnFail(page: Page, cpId: string): Promise<void> {
  46 |   const dir = path.join(process.cwd(), "tests/screenshots");
  47 |   fs.mkdirSync(dir, { recursive: true });
  48 |   try {
  49 |     await page.screenshot({
  50 |       path: path.join(dir, `${cpId}-fail.png`),
  51 |       fullPage: true,
  52 |     });
  53 |   } catch {
  54 |     // La página puede estar cerrada; ignoramos el error del screenshot.
  55 |   }
  56 | }
  57 | 
```