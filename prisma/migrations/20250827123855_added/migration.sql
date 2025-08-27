/*
  Warnings:

  - You are about to drop the column `userInfo` on the `Resume` table. All the data in the column will be lost.
  - Added the required column `profile` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Resume" DROP COLUMN "userInfo",
ADD COLUMN     "profile" JSONB NOT NULL;
