"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowClockwise } from '@phosphor-icons/react';
import { Button, Card, StatCard, PageHeader, PageSection, Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@store-flow/ui';
import { apiRequest } from '@/src/shared/api/http-client';
import { useAppUiStore } from '@/src/shared/state/app-ui-store';
import { QueryState } from '@/src/features/backoffice/presentation/shared';
import { DashboardShell } from './dashboard-shell';

type Data = {
  metrics?: { label: string; value: string; description: string }[];
  summary?: { label: string; value: string; description: string }[];
  inventoryRisk?: { rows: Record<string, string | number>[] };
};
export function OperationalReadPage({ kind }: { kind: 'overview' | 'reports' }) {
  const { role } = useParams<{ role: string }>();
  const store = useAppUiStore(state => state.activeStore);
  const base = `/${role}/dashboard`;
  const query = useQuery({ queryKey: ['dashboard', store?.id, kind], queryFn: () => apiRequest<Data>(`/dashboard/${kind}`), retry: false });
  const metrics = query.data?.metrics ?? query.data?.summary ?? [];
  const risk = query.data?.inventoryRisk?.rows ?? [];
  return <DashboardShell activeItem={kind === 'overview' ? 'Overview' : 'Reports'} operatorRole="Equipe" status={store?.name ?? 'Filial ativa'}>
    <PageHeader title={kind === 'overview' ? 'Visão geral' : 'Relatórios'} description={kind === 'overview' ? 'Vendas, catálogo e reposição da filial.' : 'Indicadores acumulados a partir dos registros da filial.'} actions={<Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><ArrowClockwise aria-hidden="true" className="size-4" />{query.isFetching ? 'Atualizando…' : 'Atualizar'}</Button>} primaryAction={kind === 'overview' ? <Button asChild><Link href={`${base}/orders`}>Pedidos de venda</Link></Button> : undefined} />
    <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
    {query.data && <>
      {kind === 'overview' ? <section aria-label="Indicadores da filial" aria-busy={query.isFetching} className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map(metric => <StatCard key={metric.label} label={metric.label} value={/^\d+$/.test(metric.value) ? Number(metric.value) : metric.value} hint={metric.description} />)}
      </section> : <dl className="grid gap-x-5 gap-y-3 border-b pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy={query.isFetching}>{metrics.map(metric => <div key={metric.label} className="grid min-w-0 content-start gap-1"><dt className="text-xs text-muted-foreground">{metric.label}</dt><dd className="break-words text-xl font-semibold tabular-nums">{metric.value}</dd><dd className="text-xs text-muted-foreground">{metric.description}</dd></div>)}</dl>}
      {kind === 'overview' && <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"><h2 className="text-base font-semibold">Reposição de estoque</h2><p className="text-xs text-muted-foreground">Até 10 itens abaixo do mínimo</p></div>
        <Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Em estoque</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>{risk.map((row, index) => <TableRow key={String(row.sku ?? index)}><TableCell className="font-medium">{row.product}</TableCell><TableCell>{row.sku}</TableCell><TableCell className="text-right tabular-nums">{row.stock}</TableCell><TableCell className="text-right tabular-nums">{row.demand}</TableCell><TableCell className="text-right"><Button asChild variant="ghost" size="sm"><Link href={`${base}/inventory?q=${encodeURIComponent(String(row.sku ?? row.product ?? ''))}`}>Ver no estoque<span className="sr-only">: {row.product}</span></Link></Button></TableCell></TableRow>)}</TableBody></Table>
        {!risk.length && <p className="p-4 text-sm text-muted-foreground">Nenhum produto abaixo do estoque mínimo.</p>}
      </Card>}
      <PageSection title="Consultar os registros" description="Acesse as operações que compõem os indicadores."><div className="flex flex-wrap gap-2">{[['orders', 'Pedidos de venda'], ['cash-register', 'Caixa e fechamentos'], ['customers', 'Clientes e contas'], ['inventory', 'Produtos e estoque'], ['suppliers', 'Fornecedores e compras']].map(([path, label]) => <Button asChild variant="outline" key={path}><Link href={`${base}/${path}`}>{label}</Link></Button>)}</div></PageSection>
    </>}
  </DashboardShell>;
}
