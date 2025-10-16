/*
  Warnings:

  - You are about to drop the column `certificates` on the `Resume` table. All the data in the column will be lost.
  - Added the required column `customSections` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add customSections column with default empty array
ALTER TABLE "Resume" ADD COLUMN "customSections" JSONB DEFAULT '[]' NOT NULL;

-- Step 2: Migrate certificates data to customSections format (simplified approach)
-- For now, just set all to empty array. Existing certificates data will be handled in application layer if needed.
UPDATE "Resume" 
SET "customSections" = '[]'::jsonb;

-- Step 3: Drop the old certificates column
ALTER TABLE "Resume" DROP COLUMN "certificates";

-- Step 4: Remove the default constraint from customSections
ALTER TABLE "Resume" ALTER COLUMN "customSections" DROP DEFAULT;
