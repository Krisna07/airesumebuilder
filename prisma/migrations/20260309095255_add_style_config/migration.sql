-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "styleConfig" JSONB;

-- CreateTable
CREATE TABLE "UsageHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regenTotal" INTEGER NOT NULL DEFAULT 0,
    "downloadTotal" INTEGER NOT NULL DEFAULT 0,
    "clTotal" INTEGER NOT NULL DEFAULT 0,
    "analysisTotal" INTEGER NOT NULL DEFAULT 0,
    "uploadTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageHistory_userId_key" ON "UsageHistory"("userId");

-- AddForeignKey
ALTER TABLE "UsageHistory" ADD CONSTRAINT "UsageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
