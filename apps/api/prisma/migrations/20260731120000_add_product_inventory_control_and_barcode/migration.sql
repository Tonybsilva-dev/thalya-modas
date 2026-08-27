ALTER TABLE "products"
ADD COLUMN "barcode" TEXT,
ADD COLUMN "inventory_control" TEXT NOT NULL DEFAULT 'tracked';

CREATE UNIQUE INDEX "products_store_id_barcode_key"
ON "products"("store_id", "barcode");
