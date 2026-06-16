-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "resendAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resendLockedUntil" TIMESTAMP(3);
