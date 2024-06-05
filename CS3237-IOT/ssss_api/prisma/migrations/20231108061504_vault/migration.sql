/*
  Warnings:

  - You are about to drop the column `faceEmbedding` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "faceEmbedding",
ADD COLUMN     "cardNumber" TEXT,
ADD COLUMN     "faceEmbeddings" JSONB;

-- CreateTable
CREATE TABLE "Vault" (
    "id" SERIAL NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);
