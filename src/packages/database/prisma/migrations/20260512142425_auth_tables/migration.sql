/*
  Warnings:

  - You are about to drop the column `token` on the `refreshToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `refreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `refreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "refreshToken_token_key";

-- AlterTable
ALTER TABLE "refreshToken" DROP COLUMN "token",
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "userAuth" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" VARCHAR(20) NOT NULL DEFAULT 'local',
ADD COLUMN     "provider_user_id" VARCHAR(255),
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3),
ADD COLUMN     "reset_token_hash" TEXT,
ADD COLUMN     "verification_token_expiry" TIMESTAMP(3),
ADD COLUMN     "verification_token_hash" TEXT;

-- CreateTable
CREATE TABLE "AuthAllowedEmail" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "invited_by" INTEGER,

    CONSTRAINT "AuthAllowedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthAllowedEmail_email_key" ON "AuthAllowedEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refreshToken_tokenHash_key" ON "refreshToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "AuthAllowedEmail" ADD CONSTRAINT "AuthAllowedEmail_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
