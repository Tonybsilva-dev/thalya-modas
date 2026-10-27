ALTER TABLE "users" DROP CONSTRAINT "users_role_check";
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_MANAGER','ROLE_EMPLOYEE','ROLE_CUSTOMER'));
ALTER TABLE "tenant_memberships" DROP CONSTRAINT "tenant_memberships_role_check";
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_role_check" CHECK ("role" IN ('ADMIN','MANAGER','EMPLOYEE','CUSTOMER'));
CREATE OR REPLACE FUNCTION ensure_store_tenant_membership() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE company_id TEXT; company_owner TEXT;
BEGIN
    SELECT "tenant_id", "owner_id" INTO company_id, company_owner FROM "stores" WHERE "id" = NEW."store_id";
    INSERT INTO "tenant_memberships" ("id", "tenant_id", "user_id", "role", "status", "updated_at")
    VALUES (gen_random_uuid()::text, company_id, NEW."user_id",
            CASE WHEN company_owner = NEW."user_id" THEN 'ADMIN'
                 WHEN NEW."role" = 'CUSTOMER' THEN 'CUSTOMER' WHEN NEW."role" = 'MANAGER' THEN 'MANAGER' ELSE 'EMPLOYEE' END,
            NEW."status", CURRENT_TIMESTAMP)
    ON CONFLICT ("tenant_id", "user_id") DO NOTHING;
    RETURN NEW;
END $$;
