/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,date,projectId]` on the table `ShiftAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ShiftAssignment_employeeId_date_key";

-- AlterTable
ALTER TABLE "ShiftAssignment" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_employeeId_date_projectId_key" ON "ShiftAssignment"("employeeId", "date", "projectId");
