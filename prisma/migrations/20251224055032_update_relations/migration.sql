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
ALTER TABLE "JobDescription" DROP COLUMN "resumeId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "analyzedAt",
DROP COLUMN "matchingScore";

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
