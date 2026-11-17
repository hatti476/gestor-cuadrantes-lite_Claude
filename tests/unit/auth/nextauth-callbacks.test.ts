import { describe, it, expect, vi, beforeEach } from "vitest";

// SPEC-011: cableado de los callbacks jwt/session de NextAuth

const { refreshTokenClaims } = vi.hoisted(() => ({ refreshTokenClaims: vi.fn() }));
vi.mock("@/lib/auth/session-claims", () => ({ refreshTokenClaims }));
vi.mock("@/lib/auth/authorize", () => ({ authorizeCredentials: vi.fn() }));
vi.mock("next-auth", () => ({ default: vi.fn(() => vi.fn()), __esModule: true }));
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn((o: unknown) => o) }));

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Cb = (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
const jwt = authOptions.callbacks!.jwt as unknown as Cb;
const session = authOptions.callbacks!.session as unknown as Cb;

describe("callbacks de NextAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("jwt en el login: copia id y rol del usuario sin revalidar", async () => {
    const token = await jwt({ token: {}, user: { id: "u1", email: "a@x", role: "ADMIN" } });
    expect(token).toEqual({ id: "u1", role: "ADMIN", disabled: false });
    expect(refreshTokenClaims).not.toHaveBeenCalled();
  });

  it("jwt en el resto de peticiones: delega en refreshTokenClaims", async () => {
    refreshTokenClaims.mockResolvedValue({ id: "u1", role: "VIEWER", disabled: false });
    const token = await jwt({ token: { id: "u1", role: "ADMIN" } });
    expect(refreshTokenClaims).toHaveBeenCalledWith({ id: "u1", role: "ADMIN" });
    expect(token.role).toBe("VIEWER");
  });

  it("session con token válido: expone id y rol", async () => {
    const s = await session({ session: { user: { email: "a@x" } }, token: { id: "u1", role: "TECNICO", disabled: false } });
    expect(s.user).toEqual({ email: "a@x", id: "u1", role: "TECNICO" });
  });

  it("session con token deshabilitado: sin rol aunque el token conserve uno", async () => {
    const s = await session({ session: { user: { email: "a@x" } }, token: { id: "u1", role: "ADMIN", disabled: true } });
    expect((s.user as { role?: string }).role).toBeUndefined();
  });
});
