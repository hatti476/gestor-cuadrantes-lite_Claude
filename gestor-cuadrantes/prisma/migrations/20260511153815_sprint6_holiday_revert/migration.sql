/*
  Warnings:

  - You are about to drop the column `projectId` on the `Holiday` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "year" INTEGER NOT NULL
);
INSERT INTO "new_Holiday" ("date", "description", "id", "year") SELECT "date", "description", "id", "year" FROM "Holiday";
DROP TABLE "Holiday";
ALTER TABLE "new_Holiday" RENAME TO "Holiday";
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
