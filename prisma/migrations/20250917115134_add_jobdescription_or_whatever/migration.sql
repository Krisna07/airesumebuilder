-- CreateTable
CREATE TABLE "public"."JobDescription" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_resumeId_key" ON "public"."JobDescription"("resumeId");

-- AddForeignKey
ALTER TABLE "public"."JobDescription" ADD CONSTRAINT "JobDescription_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
