-- Give every tenant a stable, globally unique storage identity.
ALTER TABLE "stores"
ADD COLUMN "slug" TEXT,
ADD COLUMN "bucket_key" TEXT;

-- Existing stores receive deterministic slugs. The full UUID suffix guarantees
-- uniqueness without relying on the current store name remaining unique.
WITH "normalized_stores" AS (
    SELECT
        "id",
        COALESCE(
            NULLIF(
                TRIM(
                    BOTH '-' FROM REGEXP_REPLACE(
                        TRANSLATE(
                            LOWER("name"),
                            'áàâãäéèêëíìîïóòôõöúùûüçñ',
                            'aaaaaeeeeiiiiooooouuuucn'
                        ),
                        '[^a-z0-9]+',
                        '-',
                        'g'
                    )
                ),
                ''
            ),
            'store'
        ) AS "base_slug"
    FROM "stores"
)
UPDATE "stores"
SET
    "slug" = LEFT("normalized_stores"."base_slug", 30)
        || '-'
        || REPLACE("stores"."id", '-', ''),
    "bucket_key" = 'stores/'
        || LEFT("normalized_stores"."base_slug", 30)
        || '-'
        || REPLACE("stores"."id", '-', '')
FROM "normalized_stores"
WHERE "normalized_stores"."id" = "stores"."id";

ALTER TABLE "stores"
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "bucket_key" SET NOT NULL;

CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
CREATE UNIQUE INDEX "stores_bucket_key_key" ON "stores"("bucket_key");

ALTER TABLE "stores"
ADD CONSTRAINT "stores_slug_format_check"
CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
ADD CONSTRAINT "stores_bucket_key_matches_slug_check"
CHECK ("bucket_key" = 'stores/' || "slug");

-- The application also omits these fields from update contracts, but the
-- trigger protects the invariant from direct Prisma or SQL writes.
CREATE FUNCTION "prevent_store_storage_identity_change"()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."slug" IS DISTINCT FROM OLD."slug"
        OR NEW."bucket_key" IS DISTINCT FROM OLD."bucket_key" THEN
        RAISE EXCEPTION 'Store slug and bucket_key are immutable'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stores_storage_identity_immutable"
BEFORE UPDATE OF "slug", "bucket_key" ON "stores"
FOR EACH ROW
EXECUTE FUNCTION "prevent_store_storage_identity_change"();
