/*
  Warnings:

  - You are about to drop the column `company` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `graduated` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `job` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `school` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "company",
DROP COLUMN "graduated",
DROP COLUMN "job",
DROP COLUMN "school";
