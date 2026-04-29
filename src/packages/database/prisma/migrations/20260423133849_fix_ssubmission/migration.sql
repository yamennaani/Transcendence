-- DropIndex
DROP INDEX "submission_groupId_fileId_key";

-- AlterTable
ALTER TABLE "submission" ALTER COLUMN "fileId" DROP NOT NULL;
