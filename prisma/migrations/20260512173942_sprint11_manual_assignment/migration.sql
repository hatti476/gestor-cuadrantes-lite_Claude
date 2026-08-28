-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShiftAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "shiftType" TEXT NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShiftAssignment" ("date", "employeeId", "id", "shiftType") SELECT "date", "employeeId", "id", "shiftType" FROM "ShiftAssignment";
DROP TABLE "ShiftAssignment";
ALTER TABLE "new_ShiftAssignment" RENAME TO "ShiftAssignment";
CREATE UNIQUE INDEX "ShiftAssignment_employeeId_date_key" ON "ShiftAssignment"("employeeId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
