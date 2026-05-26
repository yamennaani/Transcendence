/*
  Warnings:

  - A unique constraint covering the columns `[subId,userId]` on the table `evalResponse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupId]` on the table `submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EvalAssignmentStatus" AS ENUM ('Pending', 'Submitted', 'Cancelled');

-- DropIndex
DROP INDEX "evalResponse_id_userId_key";

-- CreateTable
CREATE TABLE "evalAssignment" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "evalueeGroupId" INTEGER NOT NULL,
    "evaluatorUserId" INTEGER NOT NULL,
    "evaluatorGroupId" INTEGER,
    "round" INTEGER NOT NULL,
    "status" "EvalAssignmentStatus" NOT NULL DEFAULT 'Pending',
    "submissionId" INTEGER,
    "evalResponseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evalAssignment_evalResponseId_key" ON "evalAssignment"("evalResponseId");

-- CreateIndex
CREATE UNIQUE INDEX "evalAssignment_assignmentId_evalueeGroupId_evaluatorUserId__key" ON "evalAssignment"("assignmentId", "evalueeGroupId", "evaluatorUserId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "evalResponse_subId_userId_key" ON "evalResponse"("subId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_groupId_key" ON "submission"("groupId");

-- AddForeignKey
ALTER TABLE "evalAssignment" ADD CONSTRAINT "evalAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalAssignment" ADD CONSTRAINT "evalAssignment_evalueeGroupId_fkey" FOREIGN KEY ("evalueeGroupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalAssignment" ADD CONSTRAINT "evalAssignment_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalAssignment" ADD CONSTRAINT "evalAssignment_evaluatorGroupId_fkey" FOREIGN KEY ("evaluatorGroupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalAssignment" ADD CONSTRAINT "evalAssignment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evalAssignment" ADD CONSTRAINT "evalAssignment_evalResponseId_fkey" FOREIGN KEY ("evalResponseId") REFERENCES "evalResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
