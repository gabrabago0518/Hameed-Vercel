-- CreateTable
CREATE TABLE "item_variant_groups" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_variant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_variant_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_variant_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_variant_selections" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_item_variant_selections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "item_variant_groups" ADD CONSTRAINT "item_variant_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_variant_options" ADD CONSTRAINT "item_variant_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "item_variant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_variant_selections" ADD CONSTRAINT "order_item_variant_selections_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_variant_selections" ADD CONSTRAINT "order_item_variant_selections_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "item_variant_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
