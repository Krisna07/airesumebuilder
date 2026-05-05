/*
  Warnings:

  - You are about to drop the column `regenError` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `regenFinishedAt` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `regenJobDescription` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `regenRequestedAt` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `regenStartedAt` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `regenStatus` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "regenError",
DROP COLUMN "regenFinishedAt",
DROP COLUMN "regenJobDescription",
DROP COLUMN "regenRequestedAt",
DROP COLUMN "regenStartedAt",
DROP COLUMN "regenStatus";
