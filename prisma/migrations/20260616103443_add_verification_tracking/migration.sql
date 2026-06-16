-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ttl" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);
