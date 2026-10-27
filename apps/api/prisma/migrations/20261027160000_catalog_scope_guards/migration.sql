-- Refuse migration on inconsistent legacy links; never silently reassign data.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM supplier_responsibles c JOIN suppliers p ON p.id=c.supplier_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM products c JOIN suppliers p ON p.id=c.supplier_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM product_image_assets c JOIN products p ON p.id=c.product_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM inventory_movements c JOIN products p ON p.id=c.product_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM purchase_orders c JOIN suppliers p ON p.id=c.supplier_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM purchase_order_items c JOIN purchase_orders p ON p.id=c.purchase_order_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM purchase_order_items c JOIN products p ON p.id=c.product_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM receivings c JOIN suppliers p ON p.id=c.supplier_id WHERE c.store_id<>p.store_id)
    OR EXISTS (SELECT 1 FROM receivings c JOIN purchase_orders p ON p.id=c.purchase_order_id WHERE c.store_id<>p.store_id OR c.supplier_id<>p.supplier_id)
  THEN RAISE EXCEPTION 'Catalog contains inconsistent branch links; review records before applying scope guards';
  END IF;
END $$;

CREATE FUNCTION enforce_catalog_scope() RETURNS trigger LANGUAGE plpgsql AS $$
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

  IF TG_TABLE_NAME='receivings' AND NEW.purchase_order_id IS NOT NULL THEN
    PERFORM id FROM purchase_orders WHERE id=NEW.purchase_order_id AND store_id=NEW.store_id AND supplier_id=NEW.supplier_id FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Receiving outside purchase order supplier scope' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER suppliers_scope_guard BEFORE INSERT OR UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER supplier_responsibles_scope_guard BEFORE INSERT OR UPDATE ON supplier_responsibles FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER products_scope_guard BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER product_image_assets_scope_guard BEFORE INSERT OR UPDATE ON product_image_assets FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER inventory_movements_scope_guard BEFORE INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER purchase_orders_scope_guard BEFORE INSERT OR UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER purchase_order_items_scope_guard BEFORE INSERT OR UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
CREATE TRIGGER receivings_scope_guard BEFORE INSERT OR UPDATE ON receivings FOR EACH ROW EXECUTE FUNCTION enforce_catalog_scope();
