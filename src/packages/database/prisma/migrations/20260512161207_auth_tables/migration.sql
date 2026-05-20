/*
  Warnings:

  - You are about to drop the `AuthAllowedEmail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuthAllowedEmail" DROP CONSTRAINT "AuthAllowedEmail_invited_by_fkey";

-- DropTable
DROP TABLE "AuthAllowedEmail";

-- CreateTable
CREATE TABLE "auth_allowed_emails" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "invited_by" INTEGER,

    CONSTRAINT "auth_allowed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_allowed_emails_email_key" ON "auth_allowed_emails"("email");

-- AddForeignKey
ALTER TABLE "auth_allowed_emails" ADD CONSTRAINT "auth_allowed_emails_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
