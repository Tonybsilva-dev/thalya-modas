"use client";

import { CaretUpDown, Plus } from "@phosphor-icons/react";
import {
  Avatar,
  DropdownMenu, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@store-flow/ui";
import { SidebarDropdownContent, sidebarDropdownTriggerClassName } from "@/src/shared/ui/sidebar-dropdown";
import type { Branch } from "@/src/features/backoffice/application/backoffice-api";

function BranchIdentity({ branch, companyName, sidebar = false }: { branch?: Branch; companyName?: string; sidebar?: boolean }) {
  const initials = branch?.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  return <>
    <Avatar className="size-9 min-h-9 min-w-9 shrink-0" aria-hidden="true" initials={initials || "SF"} src={branch?.logoUrl || (sidebar ? "/logo-icon-square.png" : undefined)} alt="" />
    <span className="grid min-w-0 flex-1 gap-0.5 text-left">
      <span className="truncate text-sm font-medium">{sidebar ? companyName ?? branch?.name ?? "Store Flow" : branch?.name ?? "Nenhuma filial"}</span>
      {sidebar ? <span className="truncate text-xs text-muted-foreground">Filial: {branch?.name ?? "nenhuma"}</span> : companyName && companyName !== branch?.name && <span className="truncate text-xs text-muted-foreground">{companyName}</span>}
    </span>
  </>;
}

export function BranchSwitcher({ branches, total, selected, companyName, canCreate, onSelect, onCreate, sidebar = false }: {
  sidebar?: boolean;
  branches: Branch[];
  total: number;
  selected?: Branch;
  companyName?: string;
  canCreate: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return <DropdownMenu><DropdownMenuTrigger asChild>
    <button type="button" className={sidebarDropdownTriggerClassName} aria-label={`Loja e filial. Filial ativa: ${selected?.name ?? "nenhuma"}`}>
      <BranchIdentity branch={selected} companyName={companyName} sidebar={sidebar} />
      <CaretUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-accent-foreground" />
    </button>
  </DropdownMenuTrigger><SidebarDropdownContent align="start">
    <DropdownMenuLabel>Filiais{total > 0 ? ` (${total})` : ""}</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={selected?.id ?? ""} onValueChange={onSelect} aria-label="Filiais">
      {branches.map(branch => <DropdownMenuRadioItem key={branch.id} value={branch.id} className="min-h-11 cursor-pointer gap-2.5 py-2"><BranchIdentity branch={branch} /></DropdownMenuRadioItem>)}
    </DropdownMenuRadioGroup>
    {total === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma filial cadastrada.</p>}
    {canCreate && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={onCreate} className="min-h-11 cursor-pointer gap-2.5"><Plus aria-hidden="true" className="size-4 text-muted-foreground" />Adicionar nova filial</DropdownMenuItem></>}
  </SidebarDropdownContent></DropdownMenu>;
}
