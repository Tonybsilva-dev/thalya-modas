"use client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Card, PageToolbar, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, EmptyState, EmptyStateContent, EmptyStateDescription, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";
import { ListPagination } from "./list-pagination";
import { SelectField, SelectFieldOption } from "./select-field";
import { SlidersHorizontal, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateField } from "./date-field";
import { auditKeys, getAuditActors, getAuditPage, type AuditFilters } from "../application/plans-api";
import { PageHeading, QueryState, } from "./shared";

const actions: Record<string, string> = {
  TENANT_CREATED: "Empresa cadastrada", TENANT_UPDATED: "Empresa atualizada",
  BRANCH_CREATED: "Filial cadastrada", USER_UPDATED: "Usuário atualizado",
  PLAN_CREATED: "Plano cadastrado", PLAN_UPDATED: "Plano atualizado",
  TENANT_PLAN_UPDATED: "Plano empresarial alterado", CONTROLS_UPDATED: "Controles globais alterados",
};
export function AuditHistory({ targetId }: { targetId?: string }) {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1 });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [advancedOpen,setAdvancedOpen] = useState(false);
  const [draft,setDraft] = useState({actorId:"",from:"",to:""});
  function openAdvanced() { setDraft({actorId:filters.actorId ?? "",from:fromDate,to:toDate}); setAdvancedOpen(true); }
  function clearFilters() { setFilters({page:1}); setFromDate(""); setToDate(""); }
  const advancedCount = Number(Boolean(filters.actorId)) + Number(Boolean(fromDate)) + Number(Boolean(toDate));
  const hasFilters = Boolean(filters.action || advancedCount);
  const actors = useQuery({ queryKey: [...auditKeys, "actors"], queryFn: getAuditActors });
  const query = useQuery({ queryKey: [...auditKeys, { ...filters, targetId }], queryFn: () => getAuditPage({ ...filters, targetId }) });
  return <section className="space-y-4">
    <Card className="overflow-hidden">
      <PageToolbar className="items-center justify-between">
        <p className="text-sm text-muted-foreground" role="status">{query.data ? `${query.data.total} registros encontrados` : "Histórico de eventos"}</p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="w-full sm:w-60"><Label className="sr-only" htmlFor="audit-action">Filtrar por ação</Label><SelectField id="audit-action" value={filters.action ?? ""} onValueChange={(action) => setFilters({...filters,page:1,action:action || undefined})}><SelectFieldOption value="">Todas as ações</SelectFieldOption>{Object.entries(actions).map(([key,label])=><SelectFieldOption key={key} value={key}>{label}</SelectFieldOption>)}</SelectField></div>
          <Button variant="outline" onClick={openAdvanced}><SlidersHorizontal aria-hidden="true" />Filtros avançados{advancedCount > 0 ? ` (${advancedCount})` : ""}</Button>
          {hasFilters && <Button variant="ghost" onClick={clearFilters}>Limpar tudo</Button>}
        </div>
      </PageToolbar>
      {hasFilters && <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2" aria-label="Filtros ativos">
        <span className="text-xs text-muted-foreground">Filtros ativos</span>
        {filters.action && <Button variant="outline" size="sm" aria-label="Remover filtro de ação" onClick={()=>setFilters({...filters,page:1,action:undefined})}>{actions[filters.action] ?? filters.action}<X aria-hidden="true" /></Button>}
        {filters.actorId && <Button variant="outline" size="sm" aria-label="Remover filtro de responsável" onClick={()=>setFilters({...filters,page:1,actorId:undefined})}>Responsável: {actors.data?.find(actor=>actor.id===filters.actorId)?.name ?? "selecionado"}<X aria-hidden="true" /></Button>}
        {fromDate && <Button variant="outline" size="sm" aria-label="Remover data inicial" onClick={()=>{setFromDate("");setFilters({...filters,page:1,from:undefined});}}>De: {new Date(`${fromDate}T00:00:00`).toLocaleDateString("pt-BR")}<X aria-hidden="true" /></Button>}
        {toDate && <Button variant="outline" size="sm" aria-label="Remover data final" onClick={()=>{setToDate("");setFilters({...filters,page:1,to:undefined});}}>Até: {new Date(`${toDate}T00:00:00`).toLocaleDateString("pt-BR")}<X aria-hidden="true" /></Button>}
      </div>}
    <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
      <DialogContent closeLabel="Fechar">
        <DialogHeader><DialogTitle>Filtros avançados</DialogTitle><DialogDescription>Refine os eventos por responsável e período.</DialogDescription></DialogHeader>
        <form className="space-y-5" onSubmit={(event)=>{
          event.preventDefault();setFromDate(draft.from);setToDate(draft.to);
          setFilters({...filters,page:1,actorId:draft.actorId || undefined,from:draft.from ? new Date(`${draft.from}T00:00:00`).toISOString() : undefined,to:draft.to ? new Date(`${draft.to}T23:59:59.999`).toISOString() : undefined});setAdvancedOpen(false);
        }}>
          <div className="space-y-2"><Label htmlFor="audit-actor">Responsável</Label><SelectField id="audit-actor" value={draft.actorId} onValueChange={(actorId)=>setDraft({...draft,actorId})} disabled={!actors.data}><SelectFieldOption value="">Todos os responsáveis</SelectFieldOption>{actors.data?.map(actor=><SelectFieldOption key={actor.id} value={actor.id}>{actor.name}</SelectFieldOption>)}</SelectField>{actors.error && <Button variant="link" onClick={()=>void actors.refetch()}>Tentar carregar responsáveis</Button>}</div>
          <fieldset className="space-y-3"><legend className="text-sm font-medium">Período dos eventos</legend><div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="audit-from">De</Label><DateField id="audit-from" label="De" value={draft.from} max={draft.to || undefined} onValueChange={(from)=>setDraft({...draft,from})} /></div>
            <div className="space-y-2"><Label htmlFor="audit-to">Até</Label><DateField id="audit-to" label="Até" value={draft.to} min={draft.from || undefined} onValueChange={(to)=>setDraft({...draft,to})} /></div>
          </div></fieldset>
          <DialogFooter><Button variant="outline" onClick={()=>setAdvancedOpen(false)}>Cancelar</Button><Button type="submit">Aplicar filtros</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <QueryState inline loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
    {query.data && <>
      <div className="overflow-x-auto" aria-busy={query.isFetching}><Table>
        <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Ação</TableHead><TableHead>Responsável</TableHead><TableHead>Motivo e alterações</TableHead></TableRow></TableHeader>
        <TableBody>{query.data.items.map((row) => <TableRow key={row.id}>
          <TableCell className="whitespace-nowrap"><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("pt-BR")}</time></TableCell>
          <TableCell>{actions[row.action] ?? row.action}<p className="mt-1 break-all text-xs text-muted-foreground">Destino: {row.targetId}</p></TableCell>
          <TableCell>{row.actorName ?? "Conta removida"}<p className="mt-1 break-all text-xs text-muted-foreground">{row.actorId}</p></TableCell>
          <TableCell><p>{row.reason}</p><Accordion type="single" collapsible><AccordionItem value="changes"><AccordionTrigger>Ver alterações</AccordionTrigger><AccordionContent><pre className="mt-3 max-h-72 max-w-xl overflow-auto border bg-muted p-3 text-xs">{JSON.stringify(row.changes, null, 2)}</pre></AccordionContent></AccordionItem></Accordion></TableCell>
        </TableRow>)}</TableBody>
      </Table>{!query.data.items.length && <EmptyState><EmptyStateContent><EmptyStateDescription>Nenhum evento corresponde aos filtros.</EmptyStateDescription></EmptyStateContent></EmptyState>}</div>
      <ListPagination {...query.data} disabled={query.isFetching} onPageChange={page => setFilters({ ...filters, page })} />
    </>}
    </Card>
  </section>;
}
export function AuditPage() {
  return <><PageHeading title="Auditoria" description="Acompanhe as alterações administrativas, seus responsáveis e motivos." /><AuditHistory /></>;
}
