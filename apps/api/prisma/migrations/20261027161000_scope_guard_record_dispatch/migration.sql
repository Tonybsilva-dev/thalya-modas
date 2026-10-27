-- Dispatch by table before referencing table-specific record fields.
CREATE OR REPLACE FUNCTION enforce_catalog_scope() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.store_id IS DISTINCT FROM OLD.store_id THEN
    RAISE EXCEPTION 'Catalog branch scope is immutable' USING ERRCODE='23514';
  END IF;

  IF TG_TABLE_NAME IN ('supplier_responsibles','products','purchase_orders','receivings') THEN
    IF NEW.supplier_id IS NOT NULL THEN
      PERFORM id FROM suppliers WHERE id=NEW.supplier_id AND store_id=NEW.store_id FOR KEY SHARE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Supplier outside catalog branch scope' USING ERRCODE='23514'; END IF;
    END IF;
  END IF;

  IF TG_TABLE_NAME IN ('product_image_assets','inventory_movements','purchase_order_items') THEN
    IF NEW.product_id IS NOT NULL THEN
      PERFORM id FROM products WHERE id=NEW.product_id AND store_id=NEW.store_id FOR KEY SHARE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Product outside catalog branch scope' USING ERRCODE='23514'; END IF;
    END IF;
  END IF;

  IF TG_TABLE_NAME='purchase_order_items' THEN
    PERFORM id FROM purchase_orders WHERE id=NEW.purchase_order_id AND store_id=NEW.store_id FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order outside catalog branch scope' USING ERRCODE='23514'; END IF;
  END IF;

  IF TG_TABLE_NAME='receivings' THEN
    IF NEW.purchase_order_id IS NOT NULL THEN
    PERFORM id FROM purchase_orders WHERE id=NEW.purchase_order_id AND store_id=NEW.store_id AND supplier_id=NEW.supplier_id FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Receiving outside purchase order supplier scope' USING ERRCODE='23514'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
