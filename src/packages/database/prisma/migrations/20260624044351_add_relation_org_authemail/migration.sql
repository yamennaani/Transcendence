-- AlterTable
ALTER TABLE "submission" ALTER COLUMN "passkey" SET DEFAULT lpad(floor(random() * 1000000)::text, 6, '0');

-- AddForeignKey
ALTER TABLE "auth_allowed_emails" ADD CONSTRAINT "auth_allowed_emails_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
