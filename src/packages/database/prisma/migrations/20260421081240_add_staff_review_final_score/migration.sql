-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Open', 'Close');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('FILE', 'IMAGE', 'PDF');

-- CreateEnum
CREATE TYPE "EvalSectionType" AS ENUM ('Toggle', 'Slider');

-- AlterTable
ALTER TABLE "assignment" ADD COLUMN     "groupSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pass_threshold" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
ADD COLUMN     "requiresStaffReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subtype" "SubmissionType" NOT NULL DEFAULT 'FILE';

-- CreateTable
CREATE TABLE "groupMemeber" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "groupMemeber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" SERIAL NOT NULL,
    "assId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaderId" INTEGER NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mimiType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'Open',
    "type" "SubmissionType" NOT NULL DEFAULT 'FILE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "finalScore" DOUBLE PRECISION,
    "passed" BOOLEAN,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evalSheet" (
    "id" SERIAL NOT NULL,
    "assId" INTEGER NOT NULL,

    CONSTRAINT "evalSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evalSection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "sectionType" "EvalSectionType" NOT NULL DEFAULT 'Toggle',
    "evalSheetId" INTEGER NOT NULL,

    CONSTRAINT "evalSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evalSectionScore" (
    "id" SERIAL NOT NULL,
    "responseId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "evalSectionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evalResponse" (
    "id" SERIAL NOT NULL,
    "isStaffReview" BOOLEAN NOT NULL DEFAULT false,
    "subId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "givenMarks" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "reply" TEXT,
    "rating" INTEGER,

    CONSTRAINT "evalResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groupMemeber_id_key" ON "groupMemeber"("id");

-- CreateIndex
CREATE UNIQUE INDEX "groupMemeber_userId_groupId_key" ON "groupMemeber"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_id_key" ON "group"("id");

-- CreateIndex
CREATE UNIQUE INDEX "group_assId_name_key" ON "group"("assId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "file_id_key" ON "file"("id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_id_key" ON "submission"("id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_fileId_key" ON "submission"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_groupId_fileId_key" ON "submission"("groupId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "evalSheet_id_key" ON "evalSheet"("id");

-- CreateIndex
CREATE UNIQUE INDEX "evalSheet_assId_key" ON "evalSheet"("assId");

-- CreateIndex
CREATE UNIQUE INDEX "evalSection_id_key" ON "evalSection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "evalSectionScore_responseId_sectionId_key" ON "evalSectionScore"("responseId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "evalResponse_id_key" ON "evalResponse"("id");

-- CreateIndex
CREATE UNIQUE INDEX "evalResponse_id_userId_key" ON "evalResponse"("id", "userId");

-- AddForeignKey
ALTER TABLE "groupMemeber" ADD CONSTRAINT "groupMemeber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupMemeber" ADD CONSTRAINT "groupMemeber_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_assId_fkey" FOREIGN KEY ("assId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalSheet" ADD CONSTRAINT "evalSheet_assId_fkey" FOREIGN KEY ("assId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalSection" ADD CONSTRAINT "evalSection_evalSheetId_fkey" FOREIGN KEY ("evalSheetId") REFERENCES "evalSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalSectionScore" ADD CONSTRAINT "evalSectionScore_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "evalResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalSectionScore" ADD CONSTRAINT "evalSectionScore_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "evalSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalResponse" ADD CONSTRAINT "evalResponse_subId_fkey" FOREIGN KEY ("subId") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalResponse" ADD CONSTRAINT "evalResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
