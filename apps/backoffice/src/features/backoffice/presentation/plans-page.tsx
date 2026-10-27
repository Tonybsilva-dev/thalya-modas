"use client";
import { ListPagination, useRemotePage } from "./list-pagination";
import { CheckCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, EmptyStateContent, EmptyStateDescription, Input, Label } from "@store-flow/ui";
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
      <Card className="mb-4 flex flex-wrap items-end justify-between gap-4 p-4">
        <div className="w-full space-y-2 sm:max-w-md"><Label className="shrink-0" htmlFor="plan-search">Buscar plano</Label><Input id="plan-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou descrição" /></div>
        <div className="ml-auto w-full sm:w-52"><Label className="sr-only" htmlFor="plan-filter">Status do plano</Label><SelectField id="plan-filter" value={status} onValueChange={setStatus}><SelectFieldOption value="">Todos os status</SelectFieldOption><SelectFieldOption value="PUBLISHED">Publicados</SelectFieldOption><SelectFieldOption value="DRAFT">Rascunhos</SelectFieldOption><SelectFieldOption value="ARCHIVED">Arquivados</SelectFieldOption></SelectField></div>
        {(search || status) && <Button variant="outline" onClick={() => { setSearch(""); setStatus(""); }}>Limpar filtros</Button>}
      </Card>
      <QueryState
        loading={plans.isPending || catalog.isPending}
        error={plans.error ?? catalog.error}
        retry={() => {
          void plans.refetch();
          void catalog.refetch();
        }}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans?.map((plan) => (
          <Card
            key={plan.id}
            className="flex flex-col gap-5 p-6"
          >
            <div className="flex justify-between gap-3">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <span className="text-xs text-muted-foreground">
                {
                  {
                    DRAFT: "Rascunho",
                    PUBLISHED: "Publicado",
                    ARCHIVED: "Arquivado",
                  }[plan.status]
                }
              </span>
            </div>
            <p className="flex-1 text-sm text-muted-foreground">
              {plan.description || "Sem descrição."}
            </p>
            <p className="text-2xl font-semibold">
              {plan.priceCents === null
                ? "Preço não definido"
                : (plan.priceCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
            </p>
            <p className="text-sm text-muted-foreground">
              {catalog.data?.filter((module) => plan.flags[module.key])
                .length ?? 0}{" "}
              módulos habilitados
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(plan);
                setFlags({ ...plan.flags });
                save.reset();
                setOpen(true);
              }}
            >
              Editar plano e funcionalidades
            </Button>
          </Card>
        ))}
      </div>
      {plans.data && <ListPagination {...plans.data} onPageChange={pagination.onPageChange} />}
      {plans.data && !visiblePlans?.length && <EmptyState><EmptyStateContent><EmptyStateDescription>Nenhum plano corresponde aos filtros.</EmptyStateDescription></EmptyStateContent></EmptyState>}
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
              As funcionalidades dependem do módulo habilitado. Kill switches e
              exceções empresariais são resolvidos separadamente.
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
