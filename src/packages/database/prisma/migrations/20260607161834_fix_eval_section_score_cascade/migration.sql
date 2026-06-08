-- DropForeignKey
ALTER TABLE "evalSectionScore" DROP CONSTRAINT "evalSectionScore_sectionId_fkey";

-- AddForeignKey
ALTER TABLE "evalSectionScore" ADD CONSTRAINT "evalSectionScore_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "evalSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
