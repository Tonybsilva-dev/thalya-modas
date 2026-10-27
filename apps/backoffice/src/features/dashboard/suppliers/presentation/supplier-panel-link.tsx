"use client";
import { createContext, useContext, forwardRef, type ComponentProps } from 'react';
import Link from 'next/link';
import { supplierPanelTarget, type SupplierPanelAction } from '../domain/supplier-panel-target';

export type { SupplierPanelAction } from '../domain/supplier-panel-target';
export const SupplierPanelContext = createContext<((action: SupplierPanelAction, id?: string) => void) | null>(null);

/** Retains real URLs for bookmarks/new tabs; normal clicks open in the current workspace. */
export const SupplierPanelLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof Link>>(function SupplierPanelLink({ href, onClick, ...props }, ref) {
  const open = useContext(SupplierPanelContext);
  return <Link {...props} href={href} ref={ref} onClick={event => {
    onClick?.(event);
    if (!open || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank' || props.download || (typeof href !== 'string' && (href.host || href.hostname || href.protocol))) return;
    const path = typeof href === 'string' ? href : href.pathname ?? '';
    const target = supplierPanelTarget(path);
    if (!target) return;
    event.preventDefault();
    open(target.action, target.id);
  }} />;
});
