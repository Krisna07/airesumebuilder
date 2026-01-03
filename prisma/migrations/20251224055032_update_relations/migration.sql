/*
  Warnings:

  - You are about to drop the column `resumeId` on the `JobDescription` table. All the data in the column will be lost.
  - You are about to drop the column `analyzedAt` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `matchingScore` on the `Resume` table. All the data in the column will be lost.
  - Added the required column `userId` to the `JobDescription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JobDescription" DROP CONSTRAINT "JobDescription_resumeId_fkey";

-- AlterTable
-- Add userId as nullable first so we can backfill existing rows
ALTER TABLE "JobDescription" DROP COLUMN "resumeId",
ADD COLUMN     "userId" TEXT;

-- Create a fallback migration user if it doesn't exist
INSERT INTO "User" ("id", "email", "name", "password", "image", "provider", "providerId", "createdAt", "updatedAt")
SELECT '00000000-0000-0000-0000-000000000001', 'migration-fallback@example.com', 'migration_fallback', NULL, NULL, 'migration', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'migration-fallback@example.com');

-- Backfill existing JobDescription rows that have no userId to the fallback user
UPDATE "JobDescription" SET "userId" = '00000000-0000-0000-0000-000000000001' WHERE "userId" IS NULL;

-- Now make the column required and add the foreign key
ALTER TABLE "JobDescription" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "analyzedAt",
DROP COLUMN "matchingScore";

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
