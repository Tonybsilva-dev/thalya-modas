"use client";
import { BranchSwitcher } from "./branch-switcher";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { FormDialog } from "@/src/features/backoffice/presentation/form-dialog";
import { MutationError } from "@/src/features/backoffice/presentation/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, EmptyState, EmptyStateContent, EmptyStateDescription } from "@store-flow/ui";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { SelectField,SelectFieldOption } from "@/src/features/backoffice/presentation/select-field";
import { ListPagination,useRemotePage } from "@/src/features/backoffice/presentation/list-pagination";
import { QueryState } from "@/src/features/backoffice/presentation/shared";
import { createBranch,listTenants,listTenantBranches } from "@/src/features/backoffice/application/backoffice-api";
const ToolbarContext=createContext<ReactNode>(null);
const SidebarContext=createContext<ReactNode>(null);
export const useOperationalSidebar=()=>useContext(SidebarContext);
export const useOperationalToolbar=()=>useContext(ToolbarContext);
export function OperationalContext({children}:{children:ReactNode}) {
 const {role}=useParams<{role:string}>();const [creating,setCreating]=useState(false);
 const cache=useQueryClient(); const activeStore=useAppUiStore(state=>state.activeStore);const setActiveStore=useAppUiStore(state=>state.setActiveStore);
 const [tenantId,setTenantId]=useState("");const [storeId,setStoreId]=useState("");const companyPage=useRemotePage();
 const companies=useQuery({queryKey:["operational-context","tenants",companyPage.page],queryFn:()=>listTenants(companyPage.page)});
 const selectedTenant=companies.data?.items.find(tenant=>tenant.id===tenantId)?.id || companies.data?.items[0]?.id || "";
 const branchPage=useRemotePage(selectedTenant);
 const branches=useQuery({queryKey:["operational-context","stores",selectedTenant,branchPage.page],queryFn:()=>listTenantBranches(selectedTenant,branchPage.page),enabled:Boolean(selectedTenant)});
 const selectedStore=branches.data?.items.find(store=>store.id===(storeId || activeStore?.id)) ?? branches.data?.items[0];
 const selectedId=selectedStore?.id;
 useEffect(()=>{
  if(!selectedStore || activeStore?.id===selectedStore.id)return;
  const scoped=(query:{queryKey:readonly unknown[]})=>!["operational-context","auth","platform"].includes(String(query.queryKey[0]));
  void cache.cancelQueries({predicate:scoped});cache.removeQueries({predicate:scoped});
  setActiveStore({id:selectedStore.id,name:selectedStore.name,language:"pt-BR"});
 },[selectedStore,activeStore?.id,cache,setActiveStore]);
 const create=useMutation({mutationFn:(input:{name:string;phone:string;document:string;segment:string})=>createBranch(selectedTenant,input),onSuccess:async(branch)=>{setCreating(false);setStoreId(branch.id);branchPage.onPageChange(1);await cache.invalidateQueries({queryKey:["operational-context","stores"]});}});
 const ready=Boolean(selectedId && activeStore?.id===selectedId);
 const sidebar=<>
  <div className="grid min-w-0 gap-2">
   <div className="grid min-w-0 gap-2">
    {(companies.data?.total ?? 0)>1 && <div className="w-full sm:w-60"><Label className="sr-only" htmlFor="operation-company">Empresa</Label><SelectField id="operation-company" value={selectedTenant} onValueChange={(id)=>{setTenantId(id);setStoreId("");}}>{companies.data?.items.map(tenant=><SelectFieldOption key={tenant.id} value={tenant.id}>{tenant.name}</SelectFieldOption>)}</SelectField></div>}
    {!branches.isPending && !branches.error && selectedTenant && <BranchSwitcher sidebar branches={branches.data?.items ?? []} total={branches.data?.total ?? 0} selected={selectedStore} companyName={companies.data?.items.find(tenant=>tenant.id===selectedTenant)?.name} canCreate={role==="admin"} onSelect={setStoreId} onCreate={()=>{create.reset();setCreating(true);}} />}
   </div>
   {(companies.data?.totalPages ?? 0)>1 && <ListPagination {...companies.data!} onPageChange={(page)=>{setTenantId("");setStoreId("");companyPage.onPageChange(page);}} />}
   {(branches.data?.totalPages ?? 0)>1 && <ListPagination {...branches.data!} onPageChange={(page)=>{setStoreId("");branchPage.onPageChange(page);}} />}
  </div>
 </>;
 const toolbar = (companies.isPending || (Boolean(selectedTenant) && branches.isPending) || companies.error || branches.error || companies.data?.total===0 || branches.data?.total===0) ? <div className="grid gap-2">   <QueryState loading={companies.isPending || (Boolean(selectedTenant)&&branches.isPending)} error={companies.error ?? branches.error} retry={()=>{void companies.refetch();void branches.refetch();}} />
   {companies.data?.total===0 && <EmptyState><EmptyStateContent><EmptyStateDescription>Nenhuma empresa vinculada. Solicite ao super administrador o vínculo da sua conta.</EmptyStateDescription></EmptyStateContent></EmptyState>}
   {branches.data?.total===0 && <EmptyState><EmptyStateContent><EmptyStateDescription>Esta empresa ainda não possui filiais. Cadastre uma filial para iniciar a operação.</EmptyStateDescription></EmptyStateContent></EmptyState>}
</div> : null;
 const dialog = <>
  {creating && <FormDialog title="Nova filial" description="Cadastre a filial na empresa selecionada." pending={create.isPending} onClose={()=>setCreating(false)}><form className="space-y-4" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);create.mutate({name:String(data.get("name")),phone:String(data.get("phone")),document:String(data.get("document")),segment:"mixed"});}}>{[["name","Nome",2],["phone","Telefone",10],["document","CPF / CNPJ",11]].map(([name,label,length])=><div className="space-y-2" key={name}><Label htmlFor={`new-store-${name}`}>{label}</Label><Input id={`new-store-${name}`} name={String(name)} required minLength={Number(length)} /></div>)}<MutationError error={create.error} /><Button type="submit" disabled={create.isPending}>Cadastrar filial</Button></form></FormDialog>}
 </>;
 return <SidebarContext.Provider value={sidebar}><ToolbarContext.Provider value={toolbar}>{ready ? <div key={selectedId}>{children}</div> : <main className="grid gap-4 p-6"><div className="max-w-xs">{sidebar}</div>{toolbar}</main>}{dialog}</ToolbarContext.Provider></SidebarContext.Provider>;
}
