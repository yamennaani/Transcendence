-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
