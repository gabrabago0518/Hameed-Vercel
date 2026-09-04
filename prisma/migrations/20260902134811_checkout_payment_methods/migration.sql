-- AlterTable: Order.addressId is only set for DELIVERY orders now
ALTER TABLE "orders" ALTER COLUMN "addressId" DROP NOT NULL;

-- AlterEnum: restrict PaymentMethod to QR_CODE and GCASH
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('QR_CODE', 'GCASH');
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod" USING ("method"::text::"PaymentMethod");
DROP TYPE "PaymentMethod_old";
