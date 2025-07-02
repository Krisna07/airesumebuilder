/*
  Warnings:

  - You are about to drop the `Certificate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Education` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Experience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `company` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `graduated` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "Education" DROP CONSTRAINT "Education_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "Experience" DROP CONSTRAINT "Experience_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_resumeId_fkey";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "company" TEXT NOT NULL,
ADD COLUMN     "graduated" BOOLEAN NOT NULL,
ADD COLUMN     "job" TEXT NOT NULL,
ADD COLUMN     "links" JSONB,
ADD COLUMN     "school" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "certificates" JSONB,
ADD COLUMN     "education" JSONB,
ADD COLUMN     "experience" JSONB,
ADD COLUMN     "skills" JSONB;

-- DropTable
DROP TABLE "Certificate";

-- DropTable
DROP TABLE "Education";

-- DropTable
DROP TABLE "Experience";

-- DropTable
DROP TABLE "Link";

-- DropTable
DROP TABLE "Skill";
