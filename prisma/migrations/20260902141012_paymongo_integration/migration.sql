-- AlterEnum: add EXPIRED to PaymentStatus
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';

-- AlterTable: PayMongo fields on payments
ALTER TABLE "payments" ADD COLUMN "paymongoPaymentIntentId" TEXT;
ALTER TABLE "payments" ADD COLUMN "paymongoCheckoutUrl" TEXT;
ALTER TABLE "payments" ADD COLUMN "paymongoQrCodeData" TEXT;
ALTER TABLE "payments" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "payments_paymongoPaymentIntentId_key" ON "payments"("paymongoPaymentIntentId");

-- CreateTable: webhook_events
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_events_provider_providerEventId_key" ON "webhook_events"("provider", "providerEventId");
