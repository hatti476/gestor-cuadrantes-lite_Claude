// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const getToken = vi.fn();
vi.mock("next-auth/jwt", () => ({ getToken: (...args: unknown[]) => getToken(...args) }));

import { proxy } from "@/proxy";

const BASE = "http://localhost:3000";

async function run(path: string, role: string | null): Promise<Response> {
  getToken.mockResolvedValue(role ? { role } : null);
  return proxy(new NextRequest(`${BASE}${path}`));
}

function redirectTarget(res: Response): string | null {
  const loc = res.headers.get("location");
  return loc ? new URL(loc).pathname : null;
}

describe("proxy.ts — acceso a /admin (SPEC-010 H-01)", () => {
  beforeEach(() => getToken.mockReset());

  test("ADMIN entra en /admin", async () => {
    const res = await run("/admin", "ADMIN");
    expect(redirectTarget(res)).toBeNull();
  });

  test.each(["TECNICO", "VIEWER"])("%s es redirigido a / desde /admin", async (role) => {
    expect(redirectTarget(await run("/admin", role))).toBe("/");
  });

  test("sin sesión es redirigido desde /admin", async () => {
    expect(redirectTarget(await run("/admin", null))).toBe("/");
  });

  test("un rol eliminado (SUPER_ADMIN) ya no da acceso", async () => {
    expect(redirectTarget(await run("/admin", "SUPER_ADMIN"))).toBe("/");
  });
});

describe("proxy.ts — resto de rutas", () => {
  test("sin sesión, una página protegida redirige a /login", async () => {
    expect(redirectTarget(await run("/multi-month", null))).toBe("/login");
  });

  test("las rutas /api no se redirigen (gestionan su propio 401/403)", async () => {
    expect(redirectTarget(await run("/api/employees", null))).toBeNull();
  });

  test.each(["TECNICO", "VIEWER"])("%s accede a / sin redirect", async (role) => {
    expect(redirectTarget(await run("/", role))).toBeNull();
  });
});
