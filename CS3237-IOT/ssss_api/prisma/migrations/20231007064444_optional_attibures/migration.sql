-- DropForeignKey
ALTER TABLE "PhotoLogs" DROP CONSTRAINT "PhotoLogs_userId_fkey";

-- AlterTable
ALTER TABLE "PhotoLogs" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PhotoLogs" ADD CONSTRAINT "PhotoLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
