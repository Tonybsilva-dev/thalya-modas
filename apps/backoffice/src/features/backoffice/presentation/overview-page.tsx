"use client";

import Link from "next/link";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Button, Card, StatCard, DistributionChart, Tabs, TabsList, TabsTrigger, TabsContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@store-flow/ui";
import { analyticsKey, getAnalytics } from "../application/analytics-api";
import { countUsers, platformKeys } from "../application/backoffice-api";
import { PageHeading, QueryState, StatusBadge } from "./shared";
import { ListPagination, useRemotePage } from "./list-pagination";
import { RecentCompanies } from "./recent-companies";

const overviewTabs = ["companies", "plans", "platform"] as const;
export function OverviewPage() {
  const cache = useQueryClient();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(overviewTabs).withDefault("companies").withOptions({ history: "push" }));
  const pagination = useRemotePage();
  const query = useQuery({ queryKey: [...analyticsKey, pagination.page], queryFn: () => getAnalytics(pagination.page), placeholderData: keepPreviousData });
  const users = useQuery({ queryKey: [...platformKeys.users, "count"], queryFn: countUsers });
  const data = query.data;
  return <>
    <PageHeading title="Visão geral" description="Indicadores e gestão da plataforma Store Flow." action={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={query.isFetching || users.isFetching} onClick={() => { void query.refetch(); void users.refetch(); void cache.invalidateQueries({ queryKey: [...platformKeys.tenants, "recent"] }); }}>Atualizar</Button><Button asChild><Link href="/backoffice/tenants?create=1">Nova empresa</Link></Button><Button variant="outline" asChild><Link href="/backoffice/users?create=1">Novo administrador</Link></Button></div>} />
    <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
    {data && <>
      <div className="mb-1 grid auto-cols-[minmax(240px,80vw)] grid-flow-col gap-4 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        <StatCard tone="brand" label="Empresas" value={data.summary.tenants.toLocaleString("pt-BR")} hint={`${data.summary.activeTenants} ativas · ${data.summary.suspendedTenants} suspensas`} />
        <StatCard tone="mint" label="Filiais" value={data.summary.branches.toLocaleString("pt-BR")} hint={`${data.summary.activeBranches} ativas`} />
        <StatCard tone="rose" label="Usuários" value={users.data ? users.data.count.toLocaleString("pt-BR") : "Indisponível"} loading={users.isPending && !users.data} hint={<Link className="text-primary hover:underline" href="/backoffice/users">Gerenciar usuários</Link>} />
        <StatCard tone="amber" label="Empresas sem filiais" value={data.summary.tenantsWithoutBranches.toLocaleString("pt-BR")} hint="Acompanhe a implantação das empresas" />
      </div>
      <QueryState loading={false} error={users.error} retry={() => void users.refetch()} />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><DistributionChart title="Distribuição das empresas" data={[{ label: "Ativas", value: data.summary.activeTenants, color: "var(--primary)" }, { label: "Suspensas", value: data.summary.suspendedTenants, color: "var(--destructive)" }]} /></Card>
        <Card className="p-5"><DistributionChart title="Distribuição das filiais" data={[{ label: "Ativas", value: data.summary.activeBranches, color: "var(--primary)" }, { label: "Inativas", value: Math.max(0, data.summary.branches - data.summary.activeBranches), color: "var(--muted-foreground)" }]} /></Card>
      </div>
      <Tabs value={tab} onValueChange={value => void setTab(value as typeof tab)}>
        <TabsList aria-label="Detalhes dos indicadores SaaS" className="max-w-full"><TabsTrigger value="companies">Empresas</TabsTrigger><TabsTrigger value="plans">Planos</TabsTrigger><TabsTrigger value="platform">Plataforma</TabsTrigger></TabsList>
        <TabsContent value="companies"><RecentCompanies /></TabsContent>
        <TabsContent value="plans">
          <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><h2 className="font-semibold">Empresas por plano</h2><Button variant="outline" asChild><Link href="/backoffice/plans">Gerenciar planos</Link></Button></div>
            <div className="overflow-x-auto" aria-busy={query.isFetching}><Table><TableHeader><TableRow><TableHead>Plano</TableHead><TableHead>Status</TableHead><TableHead>Preço cadastral</TableHead><TableHead>Empresas vinculadas</TableHead></TableRow></TableHeader><TableBody>{data.plans.items.map(plan => <TableRow key={plan.id}><TableCell>{plan.name}</TableCell><TableCell><StatusBadge status={plan.status} /></TableCell><TableCell>{plan.priceCents === null ? "Não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(plan.priceCents / 100)}</TableCell><TableCell>{plan.tenants}</TableCell></TableRow>)}</TableBody></Table></div><ListPagination {...data.plans} onPageChange={pagination.onPageChange} />
          </Card>
          <p className="mt-4 text-sm text-muted-foreground">Os preços são cadastrais. Empresas vinculadas não representam receita ou pagamentos confirmados.</p>
        </TabsContent>
        <TabsContent value="platform"><Card className="space-y-4 p-5"><h2 className="font-semibold">Disponibilidade da plataforma</h2><p className="text-sm">{data.controls.maintenance ? "Manutenção ativa: operações das filiais bloqueadas." : "Operações liberadas conforme os planos de cada empresa."}</p><p className="text-sm text-muted-foreground">{data.controls.disabledKeys.length} módulos ou funcionalidades desligados globalmente.</p><Button variant="outline" asChild><Link href="/backoffice/settings#platform-controls">Gerenciar controles</Link></Button></Card></TabsContent>
      </Tabs>
      <p className="mt-4 text-xs text-muted-foreground">Indicadores atualizados em {new Date(data.generatedAt).toLocaleString("pt-BR")}.</p>
    </>}
  </>;
}
