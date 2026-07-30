-- Store monetary values as fixed-precision decimals.
-- Existing floating-point values are rounded to cents during conversion.
ALTER TABLE "products"
  ALTER COLUMN "cost_price" TYPE DECIMAL(12, 2)
    USING ROUND("cost_price"::numeric, 2),
  ALTER COLUMN "sale_price" TYPE DECIMAL(12, 2)
    USING ROUND("sale_price"::numeric, 2);

ALTER TABLE "purchase_orders"
  ALTER COLUMN "total_cost" TYPE DECIMAL(14, 2)
    USING ROUND("total_cost"::numeric, 2);

ALTER TABLE "purchase_order_items"
  ALTER COLUMN "unit_cost" TYPE DECIMAL(12, 2)
    USING ROUND("unit_cost"::numeric, 2),
  ALTER COLUMN "total_cost" TYPE DECIMAL(14, 2)
    USING ROUND("total_cost"::numeric, 2);
