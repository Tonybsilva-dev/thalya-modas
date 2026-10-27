-- CreateTable
CREATE TABLE "sale_orders" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "user_id" TEXT NOT NULL,
    "request_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "cancelled_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "tracked" BOOLEAN NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_installments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "due_date" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "paid_cents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sale_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "installment_id" TEXT NOT NULL,
    "cash_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_key" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "opening_cents" INTEGER NOT NULL,
    "counted_cents" INTEGER,
    "expected_cents" INTEGER,
    "notes" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" TEXT NOT NULL,
    "cash_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_key" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_orders_store_id_created_at_idx" ON "sale_orders"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "sale_orders_store_id_customer_id_idx" ON "sale_orders"("store_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_store_id_request_key_key" ON "sale_orders"("store_id", "request_key");

-- CreateIndex
CREATE INDEX "sale_items_order_id_idx" ON "sale_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_installments_order_id_number_key" ON "sale_installments"("order_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "sale_payments_cash_session_id_request_key_key" ON "sale_payments"("cash_session_id", "request_key");

-- CreateIndex
CREATE INDEX "cash_sessions_store_id_opened_at_idx" ON "cash_sessions"("store_id", "opened_at");

-- CreateIndex
CREATE UNIQUE INDEX "cash_movements_cash_session_id_request_key_key" ON "cash_movements"("cash_session_id", "request_key");

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_installments" ADD CONSTRAINT "sale_installments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "sale_installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_cash_session_id_fkey" FOREIGN KEY ("cash_session_id") REFERENCES "cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_session_id_fkey" FOREIGN KEY ("cash_session_id") REFERENCES "cash_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

