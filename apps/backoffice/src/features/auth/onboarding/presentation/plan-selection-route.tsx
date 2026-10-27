"use client";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent } from "@store-flow/ui";
import { apiRequest } from "@/src/shared/api/http-client";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { useTranslations } from "next-intl";
export function PlanSelectionRoute() {
  const router = useRouter();
  const t = useTranslations('activation');
  const setActiveStore = useAppUiStore(state => state.setActiveStore);
  const plans = useQuery({ queryKey: ['activation-plans'], queryFn: () => apiRequest<{ plans: { id: string; name: string; available: boolean }[] }>('/onboarding/plans') });
  const selection = useMutation({ mutationFn: () => apiRequest<{ destination: string; storeId: string }>('/onboarding/plan', { method: 'POST', body: JSON.stringify({ plan: 'STARTER' }) }), onSuccess: async result => {
    const progress = await apiRequest<{ store?: { id: string; name: string; preferences?: { language: 'pt-BR' | 'en' | 'es' } } }>('/onboarding/me');
    if (progress.store) setActiveStore({ id: progress.store.id, name: progress.store.name, language: progress.store.preferences?.language ?? 'pt-BR' });
    router.replace(result.destination); router.refresh();
  } });
  return <main className="grid min-h-screen place-items-center bg-background px-4 py-8"><section className="grid w-full max-w-3xl gap-6">
    <header className="space-y-2"><p className="text-xs font-medium text-muted-foreground">Store Flow</p><h1 className="text-2xl font-semibold">{t('title')}</h1><p className="text-sm text-muted-foreground">{t('description')}</p></header>
    {plans.isPending && <p role="status">{t('loading')}</p>}
    {plans.isError && <div role="alert"><p>{plans.error.message}</p><Button onClick={() => void plans.refetch()} variant="outline">{t('retry')}</Button></div>}
    <div className="grid gap-3 sm:grid-cols-3">{plans.data?.plans.map(plan => <Card key={plan.id}><CardContent className="grid gap-4 p-5"><h2 className="text-base font-semibold">{plan.name}</h2><p className="text-sm text-muted-foreground">{t(plan.available ? 'starterDescription' : 'soon')}</p><Button disabled={!plan.available || selection.isPending} onClick={() => selection.mutate()} variant={plan.available ? 'default' : 'outline'}>{t(plan.available ? selection.isPending ? 'activating' : 'select' : 'soon')}</Button></CardContent></Card>)}</div>
    {selection.isError && <p role="alert" className="text-sm text-destructive">{selection.error.message}</p>}
  </section></main>;
}
