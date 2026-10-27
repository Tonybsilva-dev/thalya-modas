CREATE TABLE "customers" (
 "id" TEXT NOT NULL, "store_id" TEXT NOT NULL, "name" TEXT NOT NULL,
 "email" TEXT, "phone" TEXT, "document" TEXT, "notes" TEXT,
 "status" TEXT NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "customers_store_id_document_key" ON "customers"("store_id", "document");
CREATE INDEX "customers_store_id_name_idx" ON "customers"("store_id", "name");
-- Existing login accounts remain separate. Seed a commercial record per active branch membership.
INSERT INTO "customers" ("id", "store_id", "name", "email", "status", "updated_at")
SELECT m.id, m.store_id, u.name, u.email, CASE WHEN u.account_status = 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END, CURRENT_TIMESTAMP
FROM "store_memberships" m JOIN "users" u ON u.id = m.user_id
WHERE u.role = 'ROLE_CUSTOMER' AND m.status = 'ACTIVE';
