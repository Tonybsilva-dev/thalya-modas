"use client";
import { ListPagination, useRemotePage } from "./list-pagination";
import { CheckCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card, Input, Label } from "@store-flow/ui";
import { SelectField, SelectFieldOption } from "./select-field";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  catalogKey,
  auditKeys,
  getCatalog,
  getPlans,
  getPlan,
  getTenantPlan,
  saveTenantPlan,
  planKeys,
  type Resolution,
  type Plan,
  type FeatureModule,
} from "../application/plans-api";
import { MutationError, QueryState, } from "./shared";
export function TenantPlanPanel({ tenantId }: { tenantId: string }) {
  const [notice, setNotice] = useState("");
  const resolution = useQuery({
    queryKey: ["platform", "tenant-plan", tenantId],
    queryFn: () => getTenantPlan(tenantId),
  });
  const [search,setSearch] = useState("");
  const pagination = useRemotePage(search);
  const plans = useQuery({ queryKey: [...planKeys,"published-options",pagination.page,search], placeholderData:keepPreviousData, queryFn: () => getPlans(pagination.page,search,"PUBLISHED") });
  const catalog = useQuery({ queryKey: catalogKey, queryFn: getCatalog });
  return (
    <Card className="my-6 p-6">
      <h2 className="text-lg font-semibold">Plano e funcionalidades</h2>
      {notice && (
        <Alert variant="success" role="status" className="my-3"><CheckCircle aria-hidden="true" /><AlertDescription>
          {notice}
        </AlertDescription></Alert>
      )}
      <p className="mb-5 mt-2 text-sm text-muted-foreground">
        A configuração vale para todas as filiais. Exceções sobrescrevem o
        plano; kill switches globais sempre prevalecem.
      </p>
      <QueryState
        loading={resolution.isPending || plans.isPending || catalog.isPending}
        error={resolution.error ?? plans.error ?? catalog.error}
        retry={() => {
          void resolution.refetch();
          void plans.refetch();
          void catalog.refetch();
        }}
      />
      <div className="mb-4 max-w-md space-y-2"><Label htmlFor="tenant-plan-search">Buscar plano publicado</Label><Input id="tenant-plan-search" value={search} onChange={(event)=>setSearch(event.target.value)} /></div>
      {plans.data && <ListPagination {...plans.data} onPageChange={pagination.onPageChange} />}
      {resolution.data && plans.data && catalog.data && (
        <Editor
          key={JSON.stringify(resolution.data)}
          tenantId={tenantId}
          resolution={resolution.data}
          plans={plans.data.items}
          catalog={catalog.data}
          onSaved={() => setNotice("Plano e exceções salvos.")}
        />
      )}
    </Card>
  );
}
function Editor({
  tenantId,
  resolution,
  plans,
  catalog,
  onSaved,
}: {
  tenantId: string;
  resolution: Resolution;
  plans: Plan[];
  catalog: FeatureModule[];
  onSaved: () => void;
}) {
  const [planId, setPlanId] = useState(resolution.plan?.id ?? "");
  const [overrides, setOverrides] = useState({ ...resolution.overrides });
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: (input: {
      planId: string;
      overrides: Record<string, boolean>;
      reason: string;
    }) => saveTenantPlan(tenantId, input),
    onSuccess: async () => {
      onSaved();
      await cache.invalidateQueries({ queryKey: auditKeys });
      await cache.invalidateQueries({
        queryKey: ["platform", "tenant-plan", tenantId],
      });
    },
  });
  const selectedPlan = useQuery({queryKey:[...planKeys,"selected",planId],queryFn:()=>getPlan(planId),enabled:Boolean(planId)});
  const chosen = selectedPlan.data ?? plans.find((plan) => plan.id === planId) ?? (resolution.plan?.id===planId ? resolution.plan : null);
  const options = chosen && !plans.some(plan=>plan.id===chosen.id) ? [chosen,...plans] : plans;
  const resolve = (key: string) =>
    overrides[key] ?? chosen?.flags[key] ?? false;
  function setOverride(key: string, value: string) {
    const next = { ...overrides };
    if (value === "inherit") delete next[key];
    else next[key] = value === "true";
    setOverrides(next);
  }
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({
          planId,
          overrides,
          reason: String(new FormData(e.currentTarget).get("reason")),
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="tenant-plan">Plano publicado</Label>
        <SelectField
          id="tenant-plan"
          className="max-w-md"
          value={planId}
          onValueChange={(value) => setPlanId(value)}
          required
        >
          {options
            .filter((plan) => plan.status === "PUBLISHED")
            .map((plan) => (
              <SelectFieldOption key={plan.id} value={plan.id}>
                {plan.name}
              </SelectFieldOption>
            ))}
        </SelectField>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border bg-muted/30 p-4">
        <p className="text-sm">{Object.keys(overrides).length} exceções nesta empresa</p>
        <Button type="button" variant="outline" disabled={!Object.keys(overrides).length} onClick={() => setOverrides({})}>Restaurar herança do plano</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {catalog.map((module) => (
          <fieldset key={module.key} className="rounded-none border p-4">
            <legend className="px-2 text-sm font-semibold">
              {module.label}
            </legend>
            {[
              { key: module.key, label: "Módulo completo", available: true },
              ...module.features,
            ].map((feature) => {
              const isModule = feature.key === module.key;
              const globalOff =
                resolution.controls.maintenance ||
                resolution.controls.disabledKeys.includes(module.key) ||
                resolution.controls.disabledKeys.includes(feature.key);
              const effective =
                !globalOff &&
                resolve(module.key) &&
                (isModule || resolve(feature.key));
              return (
                <div
                  key={feature.key}
                  className="grid gap-2 border-b py-3 last:border-0 sm:grid-cols-[1fr_150px]"
                >
                  <label
                    htmlFor={`override-${feature.key}`}
                    className="text-sm"
                  >
                    {feature.label}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {globalOff
                        ? "Bloqueado globalmente"
                        : effective
                          ? "Disponível"
                          : "Indisponível"}{" "}
                      · Plano:{" "}
                      {chosen?.flags[feature.key] ? "incluído" : "não incluído"}
                    </span>
                  </label>
                  <SelectField
                    id={`override-${feature.key}`}
                    value={
                      feature.key in overrides
                        ? String(overrides[feature.key])
                        : "inherit"
                    }
                    disabled={!feature.available}
                    onValueChange={(value) => setOverride(feature.key, value)}
                  >
                    <SelectFieldOption value="inherit">Herdar plano</SelectFieldOption>
                    <SelectFieldOption value="true">Permitir</SelectFieldOption>
                    <SelectFieldOption value="false">Bloquear</SelectFieldOption>
                  </SelectField>
                </div>
              );
            })}
          </fieldset>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant-plan-reason">Motivo da alteração</Label>
        <Input
          id="tenant-plan-reason"
          name="reason"
          required
          minLength={5}
          maxLength={500}
        />
      </div>
      <MutationError error={save.error} />
      <Button disabled={save.isPending || !chosen} type="submit">
        {save.isPending ? "Salvando…" : "Salvar plano e exceções"}
      </Button>
    </form>
  );
}
