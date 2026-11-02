"use client";
import { ListPagination, useRemotePage } from "./list-pagination";
import { CheckCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card, PageToolbar, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, EmptyStateContent, EmptyStateDescription, Input, Label } from "@store-flow/ui";
import { SelectField, SelectFieldOption } from "./select-field";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCatalog,
  getPlans,
  savePlan,
  planKeys,
  catalogKey,
  type Plan,
  type Flags,
} from "../application/plans-api";
import { FeatureMatrix } from "./feature-matrix";
import { MutationError, PageHeading, QueryState, } from "./shared";
export function PlansPage() {
  const catalog = useQuery({ queryKey: catalogKey, queryFn: getCatalog });
  const cache = useQueryClient();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<Flags>({});
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const pagination = useRemotePage(`${search}|${status}`);
  const plans = useQuery({queryKey:[...planKeys,pagination.page,search,status],queryFn:()=>getPlans(pagination.page,search,status)});
  const visiblePlans = plans.data?.items;
  const save = useMutation({
    mutationFn: savePlan,
    onSuccess: async () => {
      setOpen(false);
      setNotice(
        "Plano salvo. As alterações valem para todas as empresas que usam este plano.",
      );
      await cache.invalidateQueries({ queryKey: planKeys });
      await cache.invalidateQueries({ queryKey: ["platform", "tenant-plan"] });
    },
  });
  return (
    <>
      <PageHeading
        title="Planos"
        description="Defina os módulos e funcionalidades disponíveis para cada empresa."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFlags({});
              save.reset();
              setOpen(true);
            }}
          >
            Novo plano
          </Button>
        }
      />
      {notice && (
        <Alert variant="success" role="status" className="mb-5"><CheckCircle aria-hidden="true" /><AlertDescription>
          {notice}
        </AlertDescription></Alert>
      )}
      <Card className="overflow-hidden">
      <PageToolbar>
        <div className="w-full space-y-1.5 sm:max-w-sm"><Label className="shrink-0" htmlFor="plan-search">Buscar plano</Label><Input id="plan-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou descrição" /></div>
        <div className="ml-auto w-full sm:w-52"><Label className="sr-only" htmlFor="plan-filter">Status do plano</Label><SelectField id="plan-filter" value={status} onValueChange={setStatus}><SelectFieldOption value="">Todos os status</SelectFieldOption><SelectFieldOption value="PUBLISHED">Publicados</SelectFieldOption><SelectFieldOption value="DRAFT">Rascunhos</SelectFieldOption><SelectFieldOption value="ARCHIVED">Arquivados</SelectFieldOption></SelectField></div>
        {(search || status) && <Button variant="outline" onClick={() => { setSearch(""); setStatus(""); }}>Limpar filtros</Button>}
      </PageToolbar>
      <QueryState
        inline
        loading={plans.isPending || catalog.isPending}
        error={plans.error ?? catalog.error}
        retry={() => {
          void plans.refetch();
          void catalog.refetch();
        }}
      />
      {plans.data && <>
        <div className="overflow-x-auto" aria-busy={plans.isFetching}>
          <Table><TableHeader><TableRow><TableHead>Plano</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Preço cadastral</TableHead><TableHead className="text-right">Módulos habilitados</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
          <TableBody>{visiblePlans?.map(plan => <TableRow key={plan.id}>
            <TableCell className="min-w-48"><p className="font-medium">{plan.name}</p>{plan.description && <p className="mt-1 max-w-lg text-xs text-muted-foreground">{plan.description}</p>}</TableCell>
            <TableCell><Badge variant={plan.status === "PUBLISHED" ? "success" : plan.status === "DRAFT" ? "warning" : "secondary"}>{({ DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Arquivado" })[plan.status]}</Badge></TableCell>
            <TableCell className="whitespace-nowrap text-right">{plan.priceCents === null ? "Não informado" : (plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
            <TableCell className="text-right">{catalog.data ? catalog.data.filter(module => plan.flags[module.key]).length : "Indisponível"}</TableCell>
            <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => { setEditing(plan); setFlags({ ...plan.flags }); save.reset(); setOpen(true); }}>Editar<span className="sr-only"> {plan.name}</span></Button></TableCell>
          </TableRow>)}</TableBody></Table>
          {!visiblePlans?.length && <EmptyState><EmptyStateContent><EmptyStateDescription>Nenhum plano corresponde aos filtros.</EmptyStateDescription></EmptyStateContent></EmptyState>}
        </div>
        <ListPagination {...plans.data} onPageChange={pagination.onPageChange} disabled={plans.isFetching} />
      </>}
      </Card>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!save.isPending) setOpen(value);
        }}
      >
        <DialogContent size="wide" closeLabel="Fechar">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar plano" : "Criar plano"}
            </DialogTitle>
            <DialogDescription>
              As funcionalidades dependem dos módulos habilitados. Controles
              globais e exceções de cada empresa são configurados separadamente.
            </DialogDescription>
          </DialogHeader>
          <form
            key={editing?.id ?? "new"}
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const price = String(form.get("price"));
              save.mutate({
                id: editing?.id,
                name: String(form.get("name")),
                description: String(form.get("description")),
                status: String(form.get("status")) as Plan["status"],
                priceCents:
                  price === "" ? null : Math.round(Number(price) * 100),
                flags,
                reason: String(form.get("reason")),
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nome</Label>
                <Input
                  id="plan-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={editing?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-status">Status</Label>
                <SelectField
                  id="plan-status"
                  name="status"
                  defaultValue={editing?.status ?? "DRAFT"}
                >
                  <SelectFieldOption value="DRAFT">Rascunho</SelectFieldOption>
                  <SelectFieldOption value="PUBLISHED">Publicado</SelectFieldOption>
                  <SelectFieldOption value="ARCHIVED">Arquivado</SelectFieldOption>
                </SelectField>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-price">Preço mensal (R$)</Label>
                <Input
                  id="plan-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    editing?.priceCents == null ? "" : editing.priceCents / 100
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-description">Descrição</Label>
                <Input
                  id="plan-description"
                  name="description"
                  maxLength={1000}
                  defaultValue={editing?.description}
                />
              </div>
            </div>
            {catalog.data && (
              <FeatureMatrix
                catalog={catalog.data}
                flags={flags}
                onChange={setFlags}
              />
            )}
            <div className="space-y-2">
              <Label htmlFor="plan-reason">Motivo da alteração</Label>
              <Input
                id="plan-reason"
                name="reason"
                required
                minLength={5}
                maxLength={500}
              />
            </div>
            <MutationError error={save.error} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending || !catalog.data}>
                {save.isPending ? "Salvando…" : "Salvar plano"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
