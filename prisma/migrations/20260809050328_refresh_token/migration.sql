-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "customTemplateName" TEXT,
ADD COLUMN     "customTemplateVersion" INTEGER,
ADD COLUMN     "templateSnapshot" JSONB;

-- CreateTable
CREATE TABLE "ResumeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "baseTemplateId" TEXT,
    "latestVersion" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "layoutConfig" JSONB NOT NULL,
    "styleTokens" JSONB NOT NULL,
    "sectionRules" JSONB NOT NULL,
    "previewMeta" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "refreshToken" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTemplate_name_key" ON "ResumeTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTemplate_normalizedName_key" ON "ResumeTemplate"("normalizedName");

-- CreateIndex
CREATE INDEX "ResumeTemplate_createdByUserId_idx" ON "ResumeTemplate"("createdByUserId");

-- CreateIndex
CREATE INDEX "ResumeTemplate_isPublic_updatedAt_idx" ON "ResumeTemplate"("isPublic", "updatedAt");

-- CreateIndex
CREATE INDEX "ResumeTemplateVersion_templateId_createdAt_idx" ON "ResumeTemplateVersion"("templateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTemplateVersion_templateId_version_key" ON "ResumeTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_key_key" ON "RefreshToken"("key");

-- CreateIndex
CREATE INDEX "Resume_customTemplateName_idx" ON "Resume"("customTemplateName");

-- AddForeignKey
ALTER TABLE "ResumeTemplate" ADD CONSTRAINT "ResumeTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTemplate" ADD CONSTRAINT "ResumeTemplate_baseTemplateId_fkey" FOREIGN KEY ("baseTemplateId") REFERENCES "ResumeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTemplateVersion" ADD CONSTRAINT "ResumeTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ResumeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
