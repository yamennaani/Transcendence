-- AlterTable
ALTER TABLE "auth_allowed_emails" ADD COLUMN     "orgId" INTEGER;

-- AlterTable
ALTER TABLE "submission" ALTER COLUMN "passkey" SET DEFAULT lpad(floor(random() * 1000000)::text, 6, '0');
