ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE cash_sessions ADD CONSTRAINT cash_sessions_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX cash_sessions_one_open_per_store ON cash_sessions(store_id) WHERE closed_at IS NULL;
ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_positive_total CHECK (total_cents > 0);
ALTER TABLE sale_items ADD CONSTRAINT sale_items_positive CHECK (quantity > 0 AND unit_price_cents > 0);
ALTER TABLE sale_installments ADD CONSTRAINT sale_installments_balance CHECK (amount_cents > 0 AND paid_cents >= 0 AND paid_cents <= amount_cents);
ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_positive CHECK (amount_cents > 0 AND method IN ('CASH', 'PIX', 'CARD'));
ALTER TABLE cash_sessions ADD CONSTRAINT cash_sessions_nonnegative CHECK (opening_cents >= 0 AND (counted_cents IS NULL OR counted_cents >= 0));
ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_positive CHECK (amount_cents > 0 AND kind IN ('SUPPLY', 'WITHDRAWAL'));