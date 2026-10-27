-- Preserve assignments, prices and flags of customized plans.
UPDATE plans SET name = 'Starter', updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000001' AND name = 'Padrão';
