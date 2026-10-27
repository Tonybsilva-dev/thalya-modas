"use client";
import { useEffect, useState } from 'react';
import { useSupplierFlowStore } from '../application/supplier-flow-store';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useAppUiStore } from '@/src/shared/state/app-ui-store';
import { QueryState } from '@/src/features/backoffice/presentation/shared';
import { getSupplier } from '../application/suppliers-api';
import { X } from '@phosphor-icons/react';
import { Button, ConfirmDialog, Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@store-flow/ui';
import { SupplierFormRoute, SupplierResponsibleModal, SupplierDeleteModal } from './supplier-flow-routes';
import type { SupplierPanelAction } from './supplier-panel-link';

export type SupplierEditorState = { dirty: boolean; busy: boolean };
export function SupplierPanel({ action, supplierId, onClose, onSaved }: { action: SupplierPanelAction; supplierId?: string; onClose: () => void; onSaved: (notice: string, id?: string) => void }) {
  const [state, setState] = useState<SupplierEditorState>({ dirty: false, busy: false });
  const [discard, setDiscard] = useState(false);
  const storeId = useAppUiStore(state => state.activeStore?.id);
  const draftStoreId = useSupplierFlowStore(state => state.storeId);
  const initializeScope = useSupplierFlowStore(state => state.initializeScope);
  useEffect(() => { if (storeId && draftStoreId !== storeId) initializeScope(storeId); }, [storeId, draftStoreId, initializeScope]);
  const scopeReady = Boolean(storeId && draftStoreId === storeId);
  const validId = z.uuid().safeParse(supplierId).success;
  const supplier = useQuery({ queryKey: ['suppliers', storeId, supplierId], queryFn: () => getSupplier(supplierId!), enabled: validId && action !== 'create' });
  const titles = { create: 'Cadastrar fornecedor', edit: 'Editar fornecedor', contacts: 'Contatos do fornecedor', delete: 'Excluir fornecedor' };
  function close() { if (state.busy) return; if (state.dirty) setDiscard(true); else onClose(); }
  if (action === 'delete') return supplier.data ? <SupplierDeleteModal supplier={supplier.data} supplierId={supplierId} onClose={onClose} onDeleted={() => onSaved('deleted')} /> : <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Excluir fornecedor</DialogTitle><DialogDescription>Confira o fornecedor antes de confirmar a exclusão.</DialogDescription></DialogHeader><QueryState loading={validId && supplier.isPending} error={validId ? supplier.error : new Error('Identificador de fornecedor inválido.')} retry={() => void supplier.refetch()} /><Button variant="outline" onClick={onClose}>Fechar</Button></DialogContent></Dialog>;
  return <>
    <Sheet open onOpenChange={open => { if (!open) close(); }}>
      <SheetContent hideCloseButton onEscapeKeyDown={event => { if (event.defaultPrevented) return; event.preventDefault(); close(); }} onInteractOutside={event => event.preventDefault()}>
        <SheetHeader className="relative px-4 py-3"><SheetTitle className="[font-family:var(--font-primary)]">{titles[action]}</SheetTitle><SheetDescription>Os filtros e a listagem permanecem no contexto da filial ativa.</SheetDescription><Button className="absolute right-2 top-2" size="icon" variant="ghost" disabled={state.busy} aria-label="Fechar painel" onClick={close}><X aria-hidden="true" className="size-4" /></Button></SheetHeader>
        <SheetBody className="gap-3 px-4 py-3">
          {!scopeReady ? <p role="status" className="text-sm text-muted-foreground">Preparando o cadastro da filial ativa…</p> : action === 'contacts' ? supplier.data ? <SupplierResponsibleModal supplier={supplier.data} supplierId={supplierId} inline onClose={onClose} onStateChange={setState} /> : <QueryState loading={validId && supplier.isPending} error={validId ? supplier.error : new Error('Identificador de fornecedor inválido.')} retry={() => void supplier.refetch()} /> : <SupplierFormRoute mode={action} supplierId={supplierId} onClose={close} onSaved={(id, notice) => onSaved(notice, id)} onStateChange={setState} />}
        </SheetBody>
      </SheetContent>
    </Sheet>
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title="Descartar alterações?" description="As alterações não salvas deste painel serão perdidas." confirmLabel="Descartar e fechar" cancelLabel="Continuar editando" destructive onConfirm={onClose} />
  </>;
}
