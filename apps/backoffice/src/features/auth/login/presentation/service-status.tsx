"use client";
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
export function ServiceStatus() {
  const t = useTranslations('activation');
  const query = useQuery({ queryKey: ['public-health'], queryFn: async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/health/deep`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok && response.status !== 503) throw new Error('unavailable');
    return response.json() as Promise<{ status: string; checks: Record<string, string> }>;
  }, refetchInterval: 30000, retry: false });
  const label = query.isPending ? 'checking' : query.isError || query.data?.status === 'error' ? 'offline' : query.data?.status === 'ok' ? 'online' : 'degraded';
  return <details className="text-xs text-muted-foreground"><summary className="flex cursor-pointer items-center gap-2"><span aria-hidden="true" className={`size-1.5 rounded-full ${label === 'online' ? 'bg-success-foreground' : label === 'offline' ? 'bg-destructive' : 'bg-warning-foreground'}`} /><span role="status">{t(label)}</span></summary>{query.data && <dl className="mt-2 grid gap-1 border p-3">{Object.entries(query.data.checks).map(([key, value]) => <div key={key} className="flex justify-between gap-4"><dt>{({ database: 'Banco de dados', redis: 'Sessões e segurança', queues: 'Filas' })[key] ?? key}</dt><dd>{({ ok: 'Disponível', error: 'Indisponível', not_configured: 'Não configurado' })[value] ?? value}</dd></div>)}</dl>}</details>;
}
