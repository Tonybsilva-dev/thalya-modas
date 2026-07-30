-- Phase 3: make Store the tenant of every operational catalog record.
-- Columns start nullable so existing data can be backfilled and validated
-- before NOT NULL and foreign-key constraints are enforced.
ALTER TABLE "suppliers" ADD COLUMN "store_id" TEXT;
ALTER TABLE "supplier_responsibles" ADD COLUMN "store_id" TEXT;
ALTER TABLE "products" ADD COLUMN "store_id" TEXT;
ALTER TABLE "product_image_assets" ADD COLUMN "store_id" TEXT;
ALTER TABLE "inventory_movements" ADD COLUMN "store_id" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "store_id" TEXT;
ALTER TABLE "purchase_order_items" ADD COLUMN "store_id" TEXT;
ALTER TABLE "receivings" ADD COLUMN "store_id" TEXT;

-- Only root records without a tenant-bearing parent need user-to-store
-- resolution. Owners and active memberships are both valid candidates.
CREATE TEMP TABLE "_operational_store_candidates" ON COMMIT DROP AS
SELECT "owner_id" AS "user_id", "id" AS "store_id"
FROM "stores"
UNION
SELECT "user_id", "store_id"
FROM "store_memberships"
WHERE "status" = 'ACTIVE';

CREATE TEMP TABLE "_operational_user_store_map" ON COMMIT DROP AS
WITH "operational_users" AS (
    SELECT "user_id" FROM "suppliers"
    UNION
    SELECT "user_id" FROM "products" WHERE "supplier_id" IS NULL
)
SELECT
    "operational_users"."user_id",
    MIN("_operational_store_candidates"."store_id") AS "store_id",
    COUNT(DISTINCT "_operational_store_candidates"."store_id") AS "store_count"
FROM "operational_users"
LEFT JOIN "_operational_store_candidates"
    ON "_operational_store_candidates"."user_id" = "operational_users"."user_id"
GROUP BY "operational_users"."user_id";

DO $$
DECLARE
    "invalid_user_count" INTEGER;
BEGIN
    SELECT COUNT(*) INTO "invalid_user_count"
    FROM "_operational_user_store_map"
    WHERE "store_count" <> 1;

    IF "invalid_user_count" > 0 THEN
        RAISE EXCEPTION
            'Operational store backfill is ambiguous or unmapped for % user(s)',
            "invalid_user_count";
    END IF;
END $$;

-- Backfill roots, then propagate the tenant through their relationships.
UPDATE "suppliers" AS "supplier"
SET "store_id" = "mapping"."store_id"
FROM "_operational_user_store_map" AS "mapping"
WHERE "mapping"."user_id" = "supplier"."user_id";

UPDATE "supplier_responsibles" AS "responsible"
SET "store_id" = "supplier"."store_id"
FROM "suppliers" AS "supplier"
WHERE "supplier"."id" = "responsible"."supplier_id";

UPDATE "products" AS "product"
SET "store_id" = "supplier"."store_id"
FROM "suppliers" AS "supplier"
WHERE "supplier"."id" = "product"."supplier_id";

UPDATE "products" AS "product"
SET "store_id" = "mapping"."store_id"
FROM "_operational_user_store_map" AS "mapping"
WHERE "product"."supplier_id" IS NULL
  AND "mapping"."user_id" = "product"."user_id";

UPDATE "product_image_assets" AS "asset"
SET "store_id" = "product"."store_id"
FROM "products" AS "product"
WHERE "product"."id" = "asset"."product_id";

UPDATE "inventory_movements" AS "movement"
SET "store_id" = "product"."store_id"
FROM "products" AS "product"
WHERE "product"."id" = "movement"."product_id";

UPDATE "purchase_orders" AS "purchase_order"
SET "store_id" = "supplier"."store_id"
FROM "suppliers" AS "supplier"
WHERE "supplier"."id" = "purchase_order"."supplier_id";

UPDATE "purchase_order_items" AS "item"
SET "store_id" = "purchase_order"."store_id"
FROM "purchase_orders" AS "purchase_order"
WHERE "purchase_order"."id" = "item"."purchase_order_id";

UPDATE "receivings" AS "receiving"
SET "store_id" = "supplier"."store_id"
FROM "suppliers" AS "supplier"
WHERE "supplier"."id" = "receiving"."supplier_id";

-- Refuse to enforce constraints if any row could not be mapped or if an
-- existing relationship crosses store boundaries.
DO $$
DECLARE
    "null_store_count" INTEGER;
    "cross_store_count" INTEGER;
BEGIN
    SELECT SUM("row_count") INTO "null_store_count"
    FROM (
        SELECT COUNT(*) AS "row_count" FROM "suppliers" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "supplier_responsibles" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "products" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "product_image_assets" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "inventory_movements" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "purchase_orders" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "purchase_order_items" WHERE "store_id" IS NULL
        UNION ALL
        SELECT COUNT(*) FROM "receivings" WHERE "store_id" IS NULL
    ) AS "null_counts";

    IF "null_store_count" > 0 THEN
        RAISE EXCEPTION
            'Operational store backfill left % unmapped row(s)',
            "null_store_count";
    END IF;

    SELECT SUM("row_count") INTO "cross_store_count"
    FROM (
        SELECT COUNT(*) AS "row_count"
        FROM "supplier_responsibles" AS "responsible"
        JOIN "suppliers" AS "supplier" ON "supplier"."id" = "responsible"."supplier_id"
        WHERE "responsible"."store_id" <> "supplier"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "products" AS "product"
        JOIN "suppliers" AS "supplier" ON "supplier"."id" = "product"."supplier_id"
        WHERE "product"."store_id" <> "supplier"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "product_image_assets" AS "asset"
        JOIN "products" AS "product" ON "product"."id" = "asset"."product_id"
        WHERE "asset"."store_id" <> "product"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "inventory_movements" AS "movement"
        JOIN "products" AS "product" ON "product"."id" = "movement"."product_id"
        WHERE "movement"."store_id" <> "product"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "purchase_orders" AS "purchase_order"
        JOIN "suppliers" AS "supplier" ON "supplier"."id" = "purchase_order"."supplier_id"
        WHERE "purchase_order"."store_id" <> "supplier"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "purchase_order_items" AS "item"
        JOIN "purchase_orders" AS "purchase_order"
            ON "purchase_order"."id" = "item"."purchase_order_id"
        WHERE "item"."store_id" <> "purchase_order"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "purchase_order_items" AS "item"
        JOIN "products" AS "product" ON "product"."id" = "item"."product_id"
        WHERE "item"."store_id" <> "product"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "receivings" AS "receiving"
        JOIN "suppliers" AS "supplier" ON "supplier"."id" = "receiving"."supplier_id"
        WHERE "receiving"."store_id" <> "supplier"."store_id"
        UNION ALL
        SELECT COUNT(*)
        FROM "receivings" AS "receiving"
        JOIN "purchase_orders" AS "purchase_order"
            ON "purchase_order"."id" = "receiving"."purchase_order_id"
        WHERE "receiving"."store_id" <> "purchase_order"."store_id"
    ) AS "cross_store_counts";

    IF "cross_store_count" > 0 THEN
        RAISE EXCEPTION
            'Operational store backfill found % cross-store relationship(s)',
            "cross_store_count";
    END IF;
END $$;

-- The new tenant-scoped unique keys must be conflict-free before the old
-- actor-scoped keys are replaced.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "suppliers"
        WHERE "document" IS NOT NULL
        GROUP BY "store_id", "document"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate supplier document found within a store';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "products"
        GROUP BY "store_id", "sku"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate product SKU found within a store';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "purchase_orders"
        GROUP BY "store_id", "code"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate purchase-order code found within a store';
    END IF;
END $$;

ALTER TABLE "suppliers" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "supplier_responsibles" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "product_image_assets" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "inventory_movements" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "purchase_orders" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "purchase_order_items" ALTER COLUMN "store_id" SET NOT NULL;
ALTER TABLE "receivings" ALTER COLUMN "store_id" SET NOT NULL;

DROP INDEX "suppliers_user_id_document_key";
DROP INDEX "products_user_id_sku_key";
DROP INDEX "purchase_orders_user_id_code_key";

CREATE UNIQUE INDEX "suppliers_store_id_document_key"
ON "suppliers"("store_id", "document");
CREATE UNIQUE INDEX "products_store_id_sku_key"
ON "products"("store_id", "sku");
CREATE UNIQUE INDEX "purchase_orders_store_id_code_key"
ON "purchase_orders"("store_id", "code");

CREATE INDEX "suppliers_store_id_idx" ON "suppliers"("store_id");
CREATE INDEX "supplier_responsibles_store_id_idx"
ON "supplier_responsibles"("store_id");
CREATE INDEX "products_store_id_idx" ON "products"("store_id");
CREATE INDEX "product_image_assets_store_id_idx"
ON "product_image_assets"("store_id");
CREATE INDEX "inventory_movements_store_id_idx"
ON "inventory_movements"("store_id");
CREATE INDEX "purchase_orders_store_id_idx" ON "purchase_orders"("store_id");
CREATE INDEX "purchase_order_items_store_id_idx"
ON "purchase_order_items"("store_id");
CREATE INDEX "receivings_store_id_idx" ON "receivings"("store_id");

ALTER TABLE "suppliers"
ADD CONSTRAINT "suppliers_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_responsibles"
ADD CONSTRAINT "supplier_responsibles_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products"
ADD CONSTRAINT "products_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_image_assets"
ADD CONSTRAINT "product_image_assets_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_movements"
ADD CONSTRAINT "inventory_movements_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
ADD CONSTRAINT "purchase_orders_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items"
ADD CONSTRAINT "purchase_order_items_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "receivings"
ADD CONSTRAINT "receivings_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
