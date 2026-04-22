/*
  Warnings:

  - You are about to drop the column `email` on the `orgProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `org` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `org` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "orgProfile_email_key";

-- AlterTable
ALTER TABLE "org" ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orgProfile" DROP COLUMN "email";

-- CreateIndex
CREATE UNIQUE INDEX "org_email_key" ON "org"("email");
