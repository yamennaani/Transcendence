-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Bocal', 'Student');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "orgId" INTEGER,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'Student';

-- CreateTable
CREATE TABLE "user_profile" (
    "id" SERIAL NOT NULL,
    "bio" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "last_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_profile" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "tel_num" TEXT NOT NULL,
    "orgid" INTEGER NOT NULL,

    CONSTRAINT "org_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pass_threshold" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "created_by" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,

    CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "req_eval" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classid" INTEGER NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_id_key" ON "user_profile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_userId_key" ON "user_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "org_id_key" ON "org"("id");

-- CreateIndex
CREATE UNIQUE INDEX "org_profile_id_key" ON "org_profile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "org_profile_email_key" ON "org_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "org_profile_orgid_key" ON "org_profile"("orgid");

-- CreateIndex
CREATE UNIQUE INDEX "class_id_key" ON "class"("id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_id_key" ON "assignment"("id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_profile" ADD CONSTRAINT "org_profile_orgid_fkey" FOREIGN KEY ("orgid") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_classid_fkey" FOREIGN KEY ("classid") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
