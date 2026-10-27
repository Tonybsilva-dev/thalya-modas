import assert from 'node:assert/strict';
import { test } from 'node:test';
import { supplierPanelTarget } from '../src/features/dashboard/suppliers/domain/supplier-panel-target';
import CreatePage from '../app/(overview)/(protected)/[role]/dashboard/suppliers/create/page';
import EditPage from '../app/(overview)/(protected)/[role]/dashboard/suppliers/[supplierId]/edit/page';
import ContactsPage from '../app/(overview)/(protected)/[role]/dashboard/suppliers/[supplierId]/responsible/page';
import DeletePage from '../app/(overview)/(protected)/[role]/dashboard/suppliers/[supplierId]/delete/page';
import { useSupplierFlowStore } from '../src/features/dashboard/suppliers/application/supplier-flow-store';

test('supplier actions resolve in context, including contact shortcuts with query parameters', () => {
  assert.deepEqual(supplierPanelTarget('/admin/dashboard/suppliers/create'), { action: 'create' });
  assert.deepEqual(supplierPanelTarget('/manager/dashboard/suppliers/record-id/edit?section=contacts'), { action: 'contacts', id: 'record-id' });
  assert.deepEqual(supplierPanelTarget('/employee/dashboard/suppliers/record-id/responsible'), { action: 'contacts', id: 'record-id' });
  assert.deepEqual(supplierPanelTarget('/admin/dashboard/suppliers/record-id/delete'), { action: 'delete', id: 'record-id' });
});
test('purchase workflows and unrelated or external links keep their navigation', () => {
  for (const path of ['/admin/dashboard/suppliers/purchase-orders/create?supplierId=id', '/admin/dashboard/orders', 'https://example.test/admin/dashboard/suppliers/create', '/admin/dashboard/suppliers/id/edit/unrelated']) assert.equal(supplierPanelTarget(path), null, path);
});
test('legacy create opens the panel over the supplier list', async () => {
  await assert.rejects(() => CreatePage({ params: Promise.resolve({ role: 'admin' }) }), error => error instanceof Error && 'digest' in error && String(error.digest).includes('/admin/dashboard/suppliers?supplierAction=create'));
});
for (const [Page, action] of [[EditPage, 'edit'], [ContactsPage, 'contacts'], [DeletePage, 'delete']] as const) test(`legacy ${action} preserves the selected supplier in the workspace URL`, async () => {
  await assert.rejects(() => Page({ params: Promise.resolve({ role: 'manager', supplierId: 'record-id' }) }), error => error instanceof Error && 'digest' in error && String(error.digest).includes(`/manager/dashboard/suppliers?supplierAction=${action}&supplier=record-id`));
});

test('legacy contact shortcut opens contacts directly instead of another edit page', async () => {
  await assert.rejects(() => EditPage({ params: Promise.resolve({ role: 'admin', supplierId: 'record-id' }), searchParams: Promise.resolve({ section: 'contacts' }) }), error => error instanceof Error && 'digest' in error && String(error.digest).includes('/admin/dashboard/suppliers?supplierAction=contacts&supplier=record-id'));
});
test('supplier drafts stay in their branch and are cleared before entering another branch', () => {
  const flow = useSupplierFlowStore;
  flow.getState().initializeScope('branch-a');
  flow.getState().setSupplierDraft({ name: 'Draft restricted to A' });
  flow.getState().setResponsibleDraft({ name: 'Contact restricted to A' });
  flow.getState().initializeScope('branch-a');
  assert.equal(flow.getState().supplierDraft.name, 'Draft restricted to A');
  flow.getState().initializeScope('branch-b');
  assert.equal(flow.getState().storeId, 'branch-b');
  assert.deepEqual(flow.getState().supplierDraft, {});
  assert.deepEqual(flow.getState().responsibleDraft, {});
  assert.deepEqual(flow.getState().responsibles, []);
  flow.getState().setSupplierDraft({ name: 'Discarded' });
  flow.getState().resetFlow();
  assert.equal(flow.getState().storeId, 'branch-b');
  assert.deepEqual(flow.getState().supplierDraft, {});
});
