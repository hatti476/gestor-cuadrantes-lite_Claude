/**
 * Playwright Global Setup — BD de tests aislada (Option B)
 *
 * Antes de ejecutar cualquier test E2E:
 *   1. Elimina test.db (si existe) para empezar limpio
 *   2. Aplica todas las migraciones sobre test.db
 *   3. Ejecuta el seed con datos de prueba conocidos
 *
 * El servidor de tests (puerto 3001) lee DATABASE_URL=file:./test.db
 * configurado en playwright.config.ts → webServer.env.
 * La BD de desarrollo (dev.db / puerto 3000) no se toca nunca.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TEST_DB_URL = "file:./test.db";

export default async function globalSetup() {
  const cwd = path.resolve(__dirname, "../../"); // gestor-cuadrantes/

  // 1. Eliminar test.db y su WAL/journal para empezar desde cero
  for (const file of ["test.db", "test.db-wal", "test.db-shm", "test.db-journal"]) {
    const p = path.join(cwd, file);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }
  console.log("\n[globalSetup] test.db eliminada — empezando con BD limpia");

  const env = {
    ...process.env,
    DATABASE_URL: TEST_DB_URL,
    // Evitar que tsx/prisma lean de .env y sobreescriban DATABASE_URL
    DOTENV_CONFIG_PATH: "none",
  };

  // 2. Aplicar migraciones (crea test.db con schema completo)
  // Pasamos DATABASE_URL explícitamente en la línea de comando para que Prisma CLI
  // no pueda sobreescribirlo con .env (que apunta a dev.db)
  console.log("[globalSetup] Aplicando migraciones...");
  execSync(`DATABASE_URL="${TEST_DB_URL}" npx prisma migrate deploy`, { env, cwd, stdio: "inherit" });

  // 3. Sembrar datos de prueba
  console.log("[globalSetup] Sembrando datos...");
  execSync(`DATABASE_URL="${TEST_DB_URL}" npx tsx prisma/seed.ts`, { env, cwd, stdio: "inherit" });

  console.log("[globalSetup] ✓ BD de tests lista en test.db\n");
}
