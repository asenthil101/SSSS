/*
  Warnings:

  - You are about to drop the `PhotoLogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoLogs" DROP CONSTRAINT "PhotoLogs_userId_fkey";

-- DropTable
DROP TABLE "PhotoLogs";

-- CreateTable
CREATE TABLE "PhotoLog" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "PhotoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLog_url_key" ON "PhotoLog"("url");

-- AddForeignKey
ALTER TABLE "PhotoLog" ADD CONSTRAINT "PhotoLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
