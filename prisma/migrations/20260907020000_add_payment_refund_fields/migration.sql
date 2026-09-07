-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymongoPaymentId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "paymongoRefundId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymongoPaymentId_key" ON "payments"("paymongoPaymentId");
