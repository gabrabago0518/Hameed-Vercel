-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_CONFIRMATION';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CASH_ON_DELIVERY';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "codVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "codVerifiedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_codVerifiedByUserId_fkey" FOREIGN KEY ("codVerifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
