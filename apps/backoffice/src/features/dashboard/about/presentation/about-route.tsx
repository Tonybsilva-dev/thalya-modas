"use client";
import { useQuery } from '@tanstack/react-query';
import { Badge, PageHeader, PageSection } from '@store-flow/ui';
import { apiRequest } from '@/src/shared/api/http-client';
import { useAppUiStore } from '@/src/shared/state/app-ui-store';
import { QueryState } from '@/src/features/backoffice/presentation/shared';
import { DashboardShell } from '../../shared/presentation/dashboard-shell';

export function AboutRoute() {
  const store = useAppUiStore(state => state.activeStore);
  const health = useQuery({ queryKey: ['platform', 'api-version'], queryFn: () => apiRequest<{ version: string; status: string }>('/health'), staleTime: 60000, retry: false });
  return <DashboardShell activeItem="About" operatorRole="Equipe" status={store?.name ?? 'Filial ativa'}>
    <PageHeader title="Sobre o Store Flow" description="Informações do sistema e orientações para atendimento." />
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <PageSection title="Aplicação" description="Gestão de clientes, catálogo, estoque e fornecedores.">
        <QueryState loading={health.isPending} error={health.error} retry={() => void health.refetch()} />
        <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Produto</dt><dd className="mt-1 text-sm font-medium">Store Flow</dd></div><div><dt className="text-xs text-muted-foreground">Filial ativa</dt><dd className="mt-1 text-sm">{store?.name ?? 'Não selecionada'}</dd></div><div><dt className="text-xs text-muted-foreground">Versão informada pela API</dt><dd className="mt-1 text-sm">{health.data?.version ?? 'Não disponível'}</dd></div><div><dt className="text-xs text-muted-foreground">Processo da API</dt><dd className="mt-1"><Badge variant={health.data?.status === 'ok' ? 'success' : 'outline'}>{health.data?.status === 'ok' ? 'Respondendo' : 'Não verificado'}</Badge></dd></div></dl>
      </PageSection>
      <PageSection title="Precisa de ajuda?" description="Ao falar com a administração, envie informações que ajudem a localizar o ocorrido."><ol className="grid list-inside list-decimal gap-3 text-sm leading-6"><li>Informe a filial e a tela em que estava trabalhando.</li><li>Descreva a ação e o horário aproximado.</li><li>Se houver erro, use “Copiar referência” e envie o código junto com a mensagem ou captura da tela.</li></ol><p className="text-xs text-muted-foreground">Nunca envie sua senha ou códigos de recuperação.</p></PageSection>
    </div>
    <PageSection title="Disponibilidade das funcionalidades"><p className="max-w-3xl text-sm leading-6 text-muted-foreground">As funcionalidades disponíveis dependem do plano, das permissões e do estado da plataforma. Pedidos de venda, caixa e títulos de clientes ainda não têm operação transacional disponível. A indicação de API respondendo não comprova a disponibilidade de todas as dependências.</p></PageSection>
  </DashboardShell>;
}
