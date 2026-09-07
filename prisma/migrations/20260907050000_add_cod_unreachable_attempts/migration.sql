-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "unreachableAttempts" INTEGER NOT NULL DEFAULT 0;
