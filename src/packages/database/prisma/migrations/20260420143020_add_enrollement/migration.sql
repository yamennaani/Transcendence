-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('Active', 'Dropped');

-- DropForeignKey
ALTER TABLE "class" DROP CONSTRAINT "class_created_by_fkey";

-- CreateTable
CREATE TABLE "enrollment" (
    "id" SERIAL NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'Active',
    "userId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "enrollDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_id_key" ON "enrollment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_userId_classId_key" ON "enrollment"("userId", "classId");

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
