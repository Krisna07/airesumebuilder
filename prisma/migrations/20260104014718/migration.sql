/*
  Warnings:

  - A unique constraint covering the columns `[resumeId,jobDescriptionId]` on the table `AnalysisResult` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AnalysisResult_jobDescriptionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_resumeId_jobDescriptionId_key" ON "AnalysisResult"("resumeId", "jobDescriptionId");
