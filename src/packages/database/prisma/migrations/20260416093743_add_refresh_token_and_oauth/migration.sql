/*
  Warnings:

  - A unique constraint covering the columns `[forty_two_id]` on the table `user_auth` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_auth" ADD COLUMN     "forty_two_id" TEXT,
ADD COLUMN     "forty_two_token" TEXT,
ALTER COLUMN "pass_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_forty_two_id_key" ON "user_auth"("forty_two_id");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
