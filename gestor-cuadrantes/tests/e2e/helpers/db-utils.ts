/**
 * @module db-utils
 * @description Utilidades de aislamiento de estado para E2E.
 */

const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function ensureTestEnv(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("db-utils solo está permitido en NODE_ENV=test");
  }
}

export async function resetMonthSchedule(
  projectId: string,
  month: number,
  year: number
): Promise<void> {
  ensureTestEnv();
  const response = await fetch(`${baseUrl}/api/test/reset-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, month, year }),
  });
  if (!response.ok) throw new Error(`resetMonthSchedule failed: ${response.status}`);
}

export async function seedMinimalProject(): Promise<{
  projectId: string;
  employeeIds: string[];
}> {
  ensureTestEnv();
  const response = await fetch(`${baseUrl}/api/test/seed-minimal-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`seedMinimalProject failed: ${response.status}`);
  return response.json() as Promise<{ projectId: string; employeeIds: string[] }>;
}

export async function cleanupTestProject(projectId: string): Promise<void> {
  ensureTestEnv();
  const response = await fetch(`${baseUrl}/api/test/project/${projectId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`cleanupTestProject failed: ${response.status}`);
}
