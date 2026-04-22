-- CreateEnum
CREATE TYPE "GroupInviteStatus" AS ENUM ('Pending', 'Accepted', 'Rejected');

-- CreateTable
CREATE TABLE "groupInvite" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "reciverId" INTEGER NOT NULL,
    "targetGroupId" INTEGER NOT NULL,
    "status" "GroupInviteStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groupInvite_id_key" ON "groupInvite"("id");

-- AddForeignKey
ALTER TABLE "groupInvite" ADD CONSTRAINT "groupInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupInvite" ADD CONSTRAINT "groupInvite_reciverId_fkey" FOREIGN KEY ("reciverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupInvite" ADD CONSTRAINT "groupInvite_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
