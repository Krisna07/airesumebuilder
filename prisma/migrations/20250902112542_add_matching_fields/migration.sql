-- AlterTable
ALTER TABLE "public"."Resume" ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "matchingScore" DOUBLE PRECISION;
