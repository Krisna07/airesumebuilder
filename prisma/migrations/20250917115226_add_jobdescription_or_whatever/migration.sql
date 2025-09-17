/*
  Warnings:

  - Added the required column `company` to the `JobDescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `JobDescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `domain` to the `JobDescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `JobDescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `JobDescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."JobDescription" ADD COLUMN     "company" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "domain" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
