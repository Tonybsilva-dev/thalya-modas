"use client";
import { CheckCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card, EmptyState, EmptyStateContent, EmptyStateDescription, Input, Label } from "@store-flow/ui";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  catalogKey,
  controlKeys,
  getCatalog,
  getControls,
  saveControls,
  getAudit,
  type Controls,
} from "../application/plans-api";
import { QueryState } from "./shared";
import { ActionDialog } from "./action-dialog";
export function PlatformControls() {
  const [search, setSearch] = useState("");
  const controls = useQuery({ queryKey: controlKeys, queryFn: getControls });
  const catalog = useQuery({ queryKey: catalogKey, queryFn: getCatalog });
  const audit = useQuery({
    queryKey: ["platform", "plan-audit"],
    queryFn: getAudit,
  });
  const cache = useQueryClient();
  const [pending, setPending] = useState<{
    title: string;
    description: string;
    next: Omit<Controls, "updatedAt">;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const save = useMutation({
    mutationFn: saveControls,
    onSuccess: async () => {
      setPending(null);
      setNotice(
        "Controles atualizados. O efeito é imediato em todas as empresas.",
      );
      await cache.invalidateQueries({ queryKey: controlKeys });
      await cache.invalidateQueries({ queryKey: ["platform", "tenant-plan"] });
      await cache.invalidateQueries({ queryKey: ["platform", "plan-audit"] });
    },
  });
  const data = controls.data;
  function toggle(key: string, label: string) {
    if (!data) return;
    const off = data.disabledKeys.includes(key);
    save.reset();
    setPending({
      title: `${off ? "Religar" : "Desligar"} ${label}?`,
      description: off
        ? "O recurso volta a seguir o plano e as exceções de cada empresa."
        : "O recurso será bloqueado imediatamente para todas as empresas e suas filiais, inclusive quando o plano o permitir.",
      next: {
        maintenance: data.maintenance,
        disabledKeys: off
          ? data.disabledKeys.filter((k) => k !== key)
          : [...data.disabledKeys, key],
      },
    });
  }
  return (
    <section id="platform-controls" className="space-y-5 scroll-mt-5">
      <div>
        <h2 className="text-xl font-semibold">Controles da plataforma</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kill switches prevalecem sobre planos e exceções. A administração
          permanece acessível para recuperação.
        </p>
      </div>
      {notice && (
        <Alert variant="success" role="status"><CheckCircle aria-hidden="true" /><AlertDescription>
          {notice}
        </AlertDescription></Alert>
      )}
      <QueryState
        loading={controls.isPending || catalog.isPending}
        error={controls.error ?? catalog.error}
        retry={() => {
          void controls.refetch();
          void catalog.refetch();
        }}
      />
      {data && catalog.data && (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="font-semibold">Manutenção operacional</h3>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Bloqueia as APIs operacionais das filiais. Login, planos e
                administração continuam disponíveis.
              </p>
            </div>
            <Button
              variant={data.maintenance ? "default" : "outline"}
              disabled={save.isPending}
              onClick={() => {
                save.reset();
                setPending({
                  title: data.maintenance
                    ? "Encerrar manutenção?"
                    : "Ativar manutenção operacional?",
                  description:
                    "Esta alteração afeta as operações de todas as empresas.",
                  next: {
                    disabledKeys: data.disabledKeys,
                    maintenance: !data.maintenance,
                  },
                });
              }}
            >
              {data.maintenance ? "Encerrar manutenção" : "Ativar manutenção"}
            </Button>
          </Card>
          <Card className="space-y-2 p-4"><Label htmlFor="control-search">Encontrar módulo ou funcionalidade</Label><Input id="control-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: estoque, produtos, relatórios" className="max-w-xl" /></Card>
          <div className="grid gap-5 md:grid-cols-2">
            {catalog.data.filter((module) => `${module.label} ${module.description} ${module.features.map((feature) => feature.label).join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((module) => (
              <Card className="p-5" key={module.key}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{module.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={save.isPending}
                    onClick={() => toggle(module.key, module.label)}
                  >
                    {data.disabledKeys.includes(module.key)
                      ? "Religar módulo"
                      : "Desligar módulo"}
                  </Button>
                </div>
                <div className="divide-y border-t">
                  {module.features.map((feature) => (
                    <div
                      className="flex min-h-14 items-center justify-between gap-4 py-2"
                      key={feature.key}
                    >
                      <span className="text-sm">
                        {feature.label}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {data.disabledKeys.includes(feature.key)
                            ? "Desligada globalmente"
                            : data.disabledKeys.includes(module.key)
                              ? "Bloqueada pelo módulo"
                              : "Disponível conforme o plano"}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={save.isPending || !feature.available}
                        onClick={() => toggle(feature.key, feature.label)}
                      >
                        {data.disabledKeys.includes(feature.key)
                          ? "Religar"
                          : "Desligar"}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Histórico de alterações</h3>
        <QueryState
          loading={audit.isPending}
          error={audit.error}
          retry={() => void audit.refetch()}
        />
        {audit.data?.length === 0 && (
          <EmptyState><EmptyStateContent><EmptyStateDescription>
            Nenhuma alteração administrativa registrada.
          </EmptyStateDescription></EmptyStateContent></EmptyState>
        )}
        <ul className="divide-y">
          {audit.data?.slice(0, 10).map((item) => (
            <li key={item.id} className="space-y-1 py-3">
              <p className="text-sm font-medium">
                {(
                  {
                    PLAN_CREATED: "Plano criado",
                    PLAN_UPDATED: "Plano atualizado",
                    CONTROLS_UPDATED: "Controles globais atualizados",
                    TENANT_PLAN_UPDATED: "Plano da empresa atualizado",
                  } as Record<string, string>
                )[item.action] ?? item.action}
              </p>
              <p className="text-sm text-muted-foreground">{item.reason}</p>
              <p className="break-all text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("pt-BR")} ·
                Responsável: {item.actorName ?? item.actorId}
              </p>
            </li>
          ))}
        </ul>
      </Card>
      <ActionDialog
        open={!!pending}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        pending={save.isPending}
        error={save.error}
        onClose={() => setPending(null)}
        onConfirm={(reason) => {
          if (pending) save.mutate({ ...pending.next, reason });
        }}
      />
    </section>
  );
}
