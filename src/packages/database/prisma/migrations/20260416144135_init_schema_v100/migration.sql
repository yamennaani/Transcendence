/*
  Warnings:

  - You are about to drop the `org_profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_auth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "org_profile" DROP CONSTRAINT "org_profile_orgid_fkey";

-- DropForeignKey
ALTER TABLE "refresh_token" DROP CONSTRAINT "refresh_token_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_auth" DROP CONSTRAINT "user_auth_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_profile" DROP CONSTRAINT "user_profile_userId_fkey";

-- DropTable
DROP TABLE "org_profile";

-- DropTable
DROP TABLE "refresh_token";

-- DropTable
DROP TABLE "user_auth";

-- DropTable
DROP TABLE "user_profile";

-- CreateTable
CREATE TABLE "userProfile" (
    "id" SERIAL NOT NULL,
    "bio" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "last_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userAuth" (
    "id" SERIAL NOT NULL,
    "pass_hash" TEXT,
    "forty_two_id" TEXT,
    "forty_two_token" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "userAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orgProfile" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "tel_num" TEXT NOT NULL,
    "orgid" INTEGER NOT NULL,

    CONSTRAINT "orgProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userProfile_id_key" ON "userProfile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "userProfile_userId_key" ON "userProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "userAuth_forty_two_id_key" ON "userAuth"("forty_two_id");

-- CreateIndex
CREATE UNIQUE INDEX "userAuth_userId_key" ON "userAuth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refreshToken_token_key" ON "refreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "orgProfile_id_key" ON "orgProfile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "orgProfile_email_key" ON "orgProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "orgProfile_orgid_key" ON "orgProfile"("orgid");

-- AddForeignKey
ALTER TABLE "userProfile" ADD CONSTRAINT "userProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userAuth" ADD CONSTRAINT "userAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refreshToken" ADD CONSTRAINT "refreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orgProfile" ADD CONSTRAINT "orgProfile_orgid_fkey" FOREIGN KEY ("orgid") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
