-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rotationOrder" INTEGER NOT NULL,
    "shiftPreference" TEXT,
    "projectId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Employee_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("id", "name", "projectId", "rotationOrder", "shiftPreference", "userId") SELECT "id", "name", "projectId", "rotationOrder", "shiftPreference", "userId" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
