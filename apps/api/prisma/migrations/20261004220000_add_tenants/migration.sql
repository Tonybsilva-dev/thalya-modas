CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("status" IN ('ACTIVE', 'SUSPENDED')),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "tenants_owner_id_idx" ON "tenants"("owner_id");

CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "role" TEXT NOT NULL CHECK ("role" IN ('ADMIN', 'EMPLOYEE', 'CUSTOMER')),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("status" IN ('ACTIVE', 'SUSPENDED')),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    UNIQUE ("tenant_id", "user_id")
);
CREATE INDEX "tenant_memberships_user_id_status_idx" ON "tenant_memberships"("user_id", "status");

-- Preserve stores and their identifiers; group existing stores by their owner.
INSERT INTO "tenants" ("id", "owner_id", "name", "slug", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "owner_id", (array_agg("name" ORDER BY "created_at", "id"))[1],
       'company-' || "owner_id", MIN("created_at"), CURRENT_TIMESTAMP
FROM "stores" GROUP BY "owner_id";

ALTER TABLE "stores" ADD COLUMN "tenant_id" TEXT;
UPDATE "stores" s SET "tenant_id" = t."id" FROM "tenants" t WHERE t."owner_id" = s."owner_id";
ALTER TABLE "stores" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "stores_tenant_id_idx" ON "stores"("tenant_id");

INSERT INTO "tenant_memberships" ("id", "tenant_id", "user_id", "role", "updated_at")
SELECT gen_random_uuid()::text, "id", "owner_id", 'ADMIN', CURRENT_TIMESTAMP FROM "tenants";

INSERT INTO "tenant_memberships" ("id", "tenant_id", "user_id", "role", "status", "updated_at")
SELECT gen_random_uuid()::text, s."tenant_id", m."user_id",
       CASE WHEN u."role" = 'ROLE_CUSTOMER' THEN 'CUSTOMER' ELSE 'EMPLOYEE' END,
       CASE WHEN bool_or(m."status" = 'ACTIVE') THEN 'ACTIVE' ELSE 'SUSPENDED' END,
       CURRENT_TIMESTAMP
FROM "store_memberships" m JOIN "stores" s ON s."id" = m."store_id"
JOIN "users" u ON u."id" = m."user_id"
GROUP BY s."tenant_id", m."user_id", u."role"
ON CONFLICT ("tenant_id", "user_id") DO NOTHING;

-- Store assignments imply company membership, but never company administration.
CREATE FUNCTION ensure_store_tenant_membership() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE company_id TEXT; company_owner TEXT;
BEGIN
    SELECT "tenant_id", "owner_id" INTO company_id, company_owner FROM "stores" WHERE "id" = NEW."store_id";
    INSERT INTO "tenant_memberships" ("id", "tenant_id", "user_id", "role", "status", "updated_at")
    VALUES (gen_random_uuid()::text, company_id, NEW."user_id",
            CASE WHEN company_owner = NEW."user_id" THEN 'ADMIN'
                 WHEN NEW."role" = 'CUSTOMER' THEN 'CUSTOMER' ELSE 'EMPLOYEE' END,
            NEW."status", CURRENT_TIMESTAMP)
    ON CONFLICT ("tenant_id", "user_id") DO NOTHING;
    RETURN NEW;
END $$;
CREATE TRIGGER store_tenant_membership_insert BEFORE INSERT ON "store_memberships"
FOR EACH ROW EXECUTE FUNCTION ensure_store_tenant_membership();

CREATE FUNCTION protect_store_tenant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW."tenant_id" <> OLD."tenant_id" THEN
        RAISE EXCEPTION 'Store tenant_id is immutable';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "tenants" WHERE "id" = NEW."tenant_id" AND "owner_id" = NEW."owner_id") THEN
        RAISE EXCEPTION 'Store owner must match tenant owner';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER store_tenant_protection BEFORE INSERT OR UPDATE OF "tenant_id", "owner_id" ON "stores"
FOR EACH ROW EXECUTE FUNCTION protect_store_tenant();
