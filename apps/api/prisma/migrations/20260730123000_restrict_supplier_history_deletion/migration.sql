-- Preserve purchase and receiving history when a supplier is removed.
ALTER TABLE "purchase_orders"
DROP CONSTRAINT "purchase_orders_supplier_id_fkey";

ALTER TABLE "purchase_orders"
ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receivings"
DROP CONSTRAINT "receivings_supplier_id_fkey";

ALTER TABLE "receivings"
ADD CONSTRAINT "receivings_supplier_id_fkey"
FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
