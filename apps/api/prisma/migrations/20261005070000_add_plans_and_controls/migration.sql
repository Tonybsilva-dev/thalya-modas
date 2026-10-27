CREATE TABLE plans (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
 price_cents INTEGER CHECK (price_cents >= 0), flags JSONB NOT NULL DEFAULT '{}',
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) NOT NULL
);
INSERT INTO plans (id,name,description,status,flags,updated_at) VALUES (
 '00000000-0000-4000-8000-000000000001','Padrão','Acesso às funcionalidades disponíveis.','PUBLISHED',
 '{"catalog":true,"catalog.products":true,"catalog.images":true,"inventory":true,"inventory.movements":true,"inventory.adjustments":true,"purchasing":true,"purchasing.suppliers":true,"purchasing.orders":true,"purchasing.receivings":true,"sales":true,"sales.orders":true,"sales.customers":true,"finance":true,"finance.cash":true,"finance.receivables":true,"analytics":true,"analytics.overview":true,"analytics.reports":true}',CURRENT_TIMESTAMP
);
ALTER TABLE tenants ADD COLUMN plan_id TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES plans(id) ON DELETE RESTRICT;
ALTER TABLE tenants ADD COLUMN feature_overrides JSONB NOT NULL DEFAULT '{}';
CREATE TABLE platform_controls (id TEXT PRIMARY KEY DEFAULT 'global', disabled_keys TEXT[] NOT NULL DEFAULT '{}', maintenance BOOLEAN NOT NULL DEFAULT false, updated_at TIMESTAMP(3) NOT NULL);
INSERT INTO platform_controls (id,updated_at) VALUES ('global',CURRENT_TIMESTAMP);
CREATE TABLE plan_audit (id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,action TEXT NOT NULL,target_id TEXT NOT NULL,reason TEXT NOT NULL,changes JSONB NOT NULL,created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX plan_audit_created_at_idx ON plan_audit(created_at);
