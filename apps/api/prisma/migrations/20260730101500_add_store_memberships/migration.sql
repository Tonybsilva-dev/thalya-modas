-- CreateTable
CREATE TABLE "store_memberships" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_memberships_pkey" PRIMARY KEY ("id")
);

-- Backfill every current owner as an active member of their store.
INSERT INTO "store_memberships" (
    "id",
    "store_id",
    "user_id",
    "role",
    "status",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    "id",
    "owner_id",
    'OWNER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "stores";

-- CreateIndex
CREATE UNIQUE INDEX "store_memberships_store_id_user_id_key"
ON "store_memberships"("store_id", "user_id");

-- CreateIndex
CREATE INDEX "store_memberships_user_id_status_idx"
ON "store_memberships"("user_id", "status");

-- AddForeignKey
ALTER TABLE "store_memberships"
ADD CONSTRAINT "store_memberships_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_memberships"
ADD CONSTRAINT "store_memberships_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
