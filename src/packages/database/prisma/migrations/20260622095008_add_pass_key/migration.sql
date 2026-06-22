/*
  Warnings:

  - A unique constraint covering the columns `[passkey]` on the table `submission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "passkey" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "submission_passkey_key" ON "submission"("passkey");
