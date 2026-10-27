export type SupplierPanelAction = 'create' | 'edit' | 'contacts' | 'delete';
export function supplierPanelTarget(path: string): { action: SupplierPanelAction; id?: string } | null {
  const match = path.match(/^\/[^/?#]+\/dashboard\/suppliers\/(create|([^/?#]+)\/(edit|responsible|delete))(?:[?#]|$)/);
  if (!match) return null;
  const query = new URLSearchParams(path.split('?')[1]?.split('#')[0] ?? '');
  const editAction = query.get('modal') === 'delete' ? 'delete' : query.get('section') === 'contacts' || query.get('modal') === 'responsible' ? 'contacts' : 'edit';
  return { action: match[1] === 'create' ? 'create' : match[3] === 'responsible' ? 'contacts' : match[3] === 'edit' ? editAction : match[3] as SupplierPanelAction, ...(match[2] ? { id: match[2] } : {}) };
}
