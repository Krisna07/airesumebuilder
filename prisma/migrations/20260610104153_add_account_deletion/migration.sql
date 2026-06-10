-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DynamicRole" (
    "id" TEXT NOT NULL,
    "roleNormalized" TEXT NOT NULL,
    "roleDisplay" TEXT NOT NULL,
    "specialization" TEXT NOT NULL DEFAULT 'general',
    "seniority" TEXT NOT NULL DEFAULT 'junior',
    "bullets" JSONB NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DynamicRole_roleNormalized_idx" ON "DynamicRole"("roleNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicRole_roleNormalized_specialization_seniority_key" ON "DynamicRole"("roleNormalized", "specialization", "seniority");
