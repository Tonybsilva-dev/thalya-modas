"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Input, Label, PageSection, PageToolbar, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@store-flow/ui';
import { apiRequest } from '@/src/shared/api/http-client';
import { useAppUiStore } from '@/src/shared/state/app-ui-store';
import { QueryState } from '@/src/features/backoffice/presentation/shared';

type Plan = { plan: { name: string; description: string } | null; maintenance: boolean; features: { key: string; label: string; enabled: boolean; reason: string | null }[] };
const reasons: Record<string, string> = { MAINTENANCE: 'Manutenção da plataforma', GLOBAL_KILL_SWITCH: 'Bloqueado pela plataforma', UNAVAILABLE: 'Ainda não disponível', PLAN_INACTIVE: 'Plano não publicado', MODULE_DISABLED: 'Módulo não habilitado', FEATURE_DISABLED: 'Funcionalidade não habilitada' };
export function OperationalPlan() {
  const storeId = useAppUiStore(state => state.activeStore?.id);
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['operation-plan', storeId], queryFn: () => apiRequest<Plan>('/operations/plan') });
  const features = query.data?.features.filter(feature => feature.label.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))) ?? [];
  return <>
    <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
    {query.data && <>
      <PageSection title={query.data.plan?.name ?? 'Plano indisponível'} description={query.data.plan?.description}>
        <p className="max-w-2xl text-sm text-muted-foreground">O plano é compartilhado por todas as filiais da empresa. Para alterações, consulte a administração da plataforma.</p>
        {query.data.maintenance && <p role="status" className="text-sm text-warning-foreground">A plataforma está em manutenção. Algumas funcionalidades podem estar temporariamente bloqueadas.</p>}
      </PageSection>
      <Card className="overflow-hidden"><PageToolbar><div className="grid w-full gap-1.5 sm:max-w-sm"><Label htmlFor="plan-feature-search">Buscar funcionalidade</Label><Input id="plan-feature-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Produtos, estoque, clientes…" /></div><p className="text-xs text-muted-foreground">{features.length} de {query.data.features.length} funcionalidades</p></PageToolbar>
        <Table><TableHeader><TableRow><TableHead>Funcionalidade</TableHead><TableHead>Acesso da empresa</TableHead></TableRow></TableHeader><TableBody>{features.map(feature => <TableRow key={feature.key}><TableCell className="font-medium">{feature.label}</TableCell><TableCell><Badge variant={feature.enabled ? 'success' : 'outline'}>{feature.enabled ? 'Disponível' : reasons[feature.reason ?? ''] ?? 'Indisponível'}</Badge></TableCell></TableRow>)}</TableBody></Table>
        {!features.length && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma funcionalidade encontrada para esta busca.</p>}
      </Card>
    </>}
  </>;
}
