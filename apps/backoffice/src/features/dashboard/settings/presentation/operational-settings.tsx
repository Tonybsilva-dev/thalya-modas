"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Card, DialogFooter, FormActions, Input, Label, PageSection, PageToolbar, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, cn } from "@store-flow/ui";
import { apiRequest } from "@/src/shared/api/http-client";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { PageHeading, QueryState, MutationError, StatusBadge } from "@/src/features/backoffice/presentation/shared";
import { ListPagination, useRemotePage } from "@/src/features/backoffice/presentation/list-pagination";
import { FormDialog } from "@/src/features/backoffice/presentation/form-dialog";
import { SelectField, SelectFieldOption } from "@/src/features/backoffice/presentation/select-field";
import { listUsers } from "@/src/features/backoffice/application/backoffice-api";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { FeatureUnavailable } from "../../shared/presentation/feature-unavailable";
import { ThemeSwitcher } from "@/src/shared/ui/theme-switcher";
import { OperationalPlan } from "./operational-plan";

const sections = [
  { key: 'general', label: 'Preferências', path: '' }, { key: 'store', label: 'Filial', path: '/store' },
  { key: 'team-security', label: 'Equipe e acesso', path: '/team-security' }, { key: 'plan', label: 'Plano', path: '/plan' },
];
const roleLabels: Record<string, string> = { ROLE_ADMIN: 'Administrador', ROLE_MANAGER: 'Gerente', ROLE_EMPLOYEE: 'Funcionário', ROLE_CUSTOMER: 'Cliente' };
export function OperationalSettings({ section }: { section: string }) {
  const { role } = useParams<{ role: string }>();
  const router = useRouter();
  const active = useAppUiStore(state => state.activeStore);
  const setActive = useAppUiStore(state => state.setActiveStore);
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const pagination = useRemotePage(search);
  const [open, setOpen] = useState(false);
  const [endingSessions, setEndingSessions] = useState(false);
  const admin = role === 'admin';
  const store = useQuery({ queryKey: ['operation-store', active?.id], queryFn: () => apiRequest<{ name: string; phone: string; document: string }>('/operations/store'), enabled: section === 'store' });
  const team = useQuery({ queryKey: ['operation-team', active?.id, pagination.page, search], queryFn: () => listUsers(pagination.page, search), enabled: section === 'team-security' && admin, placeholderData: keepPreviousData });
  const save = useMutation({ mutationFn: (input: { name: string; phone: string }) => apiRequest<{ name: string }>('/operations/store', { method: 'PATCH', body: JSON.stringify(input) }), onSuccess: async saved => {
    if (active) setActive({ ...active, name: saved.name });
    await Promise.all([cache.invalidateQueries({ queryKey: ['operation-store'] }), cache.invalidateQueries({ queryKey: ['operational-context', 'stores'] })]);
  } });
  const create = useMutation({ mutationFn: (input: { name: string; email: string; password: string; role: string }) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(input) }), onSuccess: async () => { setOpen(false); await cache.invalidateQueries({ queryKey: ['operation-team'] }); } });
  const revoke = useMutation({ mutationFn: () => apiRequest('/auth/logout-all', { method: 'POST' }), onSuccess: () => { cache.clear(); setActive(null); router.replace('/auth/login'); router.refresh(); } });
  const descriptions: Record<string, string> = { general: 'Preferências pessoais e segurança da sua sessão.', store: 'Identificação e contato da filial ativa.', 'team-security': 'Consulte os usuários vinculados e cadastre membros da equipe.', plan: 'Consulte o plano e a disponibilidade das funcionalidades.' };
  return <DashboardShell settingsActive status={active?.name ?? 'Filial ativa'} operatorRole={admin ? 'Administrador' : 'Equipe'}>
    <PageHeading title="Configurações" description={descriptions[section] ?? 'Preferências da operação.'} action={section === 'team-security' && admin ? <Button onClick={() => { create.reset(); setOpen(true); }}>Novo membro</Button> : undefined} />
    <nav aria-label="Seções de configurações" className="flex max-w-full gap-1 overflow-x-auto border-b border-border">{sections.filter(item => item.key !== 'plan' || admin).map(item => <Link key={item.key} href={`/${role}/dashboard/settings${item.path}`} aria-current={section === item.key ? 'page' : undefined} className={cn('inline-flex min-h-10 shrink-0 items-center border-b-2 border-transparent px-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', section === item.key && 'border-primary font-medium text-primary')}>{item.label}</Link>)}</nav>
    {section === 'general' && <>
      <PageSection title="Aparência" description="A preferência de tema é aplicada a este navegador."><ThemeSwitcher /></PageSection>
      <PageSection title="Sessões de acesso" description="Encerre o acesso desta conta em todos os dispositivos. Será necessário entrar novamente."><Button variant="outline" className="w-fit" onClick={() => { revoke.reset(); setEndingSessions(true); }}>Encerrar todas as sessões</Button></PageSection>
    </>}
    {section === 'store' && <>
      <QueryState loading={store.isPending} error={store.error} retry={() => void store.refetch()} />
      {store.data && <form key={active?.id} className="grid gap-4" aria-busy={save.isPending} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); save.mutate({ name: String(data.get('name') ?? ''), phone: String(data.get('phone') ?? '') }); }}>
        <PageSection title="Dados da filial" description={admin ? 'Mantenha os dados usados pela equipe atualizados.' : 'Somente o administrador pode alterar estes dados.'}>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-1.5"><Label htmlFor="branch-name">Nome da filial</Label><Input id="branch-name" name="name" defaultValue={store.data.name} required minLength={2} maxLength={160} disabled={!admin || save.isPending} /></div><div className="grid gap-1.5"><Label htmlFor="branch-phone">Telefone</Label><Input id="branch-phone" name="phone" autoComplete="tel" defaultValue={store.data.phone} required minLength={10} disabled={!admin || save.isPending} /></div></div>
          <div className="border-t pt-3"><p className="text-xs text-muted-foreground">Documento cadastrado</p><p className="mt-1 text-sm">{store.data.document}</p></div>
          <MutationError error={save.error} />{save.isSuccess && <p role="status" className="text-sm text-success-foreground">Dados da filial atualizados.</p>}
        </PageSection>
        {admin && <FormActions><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar alterações'}</Button></FormActions>}
      </form>}
    </>}
    {section === 'team-security' && (admin ? <>
      <QueryState loading={team.isPending} error={team.error} retry={() => void team.refetch()} />
      <Card aria-busy={team.isFetching}><PageToolbar><div className="grid w-full gap-1.5 sm:max-w-sm"><Label htmlFor="team-search">Buscar usuário</Label><Input id="team-search" placeholder="Nome ou e-mail" value={search} onChange={event => setSearch(event.target.value)} /></div></PageToolbar>
        <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Papel</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{team.data?.items.map(user => <TableRow key={user.id}><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{roleLabels[user.role] ?? user.role}</TableCell><TableCell><StatusBadge status={user.accountStatus} /></TableCell></TableRow>)}</TableBody></Table>
        {!team.isPending && !team.error && !team.data?.items.length && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum usuário encontrado para esta busca.</p>}
        {team.data && <ListPagination {...team.data} onPageChange={pagination.onPageChange} />}
      </Card>
    </> : <PageSection title="Acesso à equipe"><p className="text-sm text-muted-foreground">Somente o administrador pode consultar e gerenciar os usuários da filial.</p></PageSection>)}
    {section === 'plan' && (admin ? <OperationalPlan /> : <PageSection title="Plano da empresa"><p className="text-sm text-muted-foreground">Consulte o administrador para informações sobre o plano.</p></PageSection>)}
    {['payments', 'notifications'].includes(section) && <FeatureUnavailable title={section === 'payments' ? 'Configurações de pagamentos' : 'Notificações'} description={section === 'payments' ? 'A configuração de meios de pagamento ainda não está disponível nesta operação.' : 'As preferências de notificação estarão disponíveis quando os canais de entrega forem ativados.'} />}
    {open && <FormDialog title="Novo membro" description="O usuário será vinculado à filial ativa. Nenhum convite por e-mail será enviado nesta etapa." pending={create.isPending} onClose={() => setOpen(false)}><form className="grid gap-4" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); create.mutate({ name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), password: String(data.get('password') ?? ''), role: String(data.get('role') ?? '') }); }}>
      <div className="grid gap-1.5"><Label htmlFor="member-name">Nome</Label><Input id="member-name" name="name" required minLength={2} autoComplete="name" /></div><div className="grid gap-1.5"><Label htmlFor="member-email">E-mail</Label><Input id="member-email" name="email" type="email" required autoComplete="email" /></div><div className="grid gap-1.5"><Label htmlFor="member-password">Senha inicial</Label><Input id="member-password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div><div className="grid gap-1.5"><Label htmlFor="member-role">Papel</Label><SelectField id="member-role" name="role" defaultValue="ROLE_EMPLOYEE"><SelectFieldOption value="ROLE_MANAGER">Gerente</SelectFieldOption><SelectFieldOption value="ROLE_EMPLOYEE">Funcionário</SelectFieldOption></SelectField></div>
      <MutationError error={create.error} /><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>Cancelar</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Cadastrando…' : 'Cadastrar membro'}</Button></DialogFooter>
    </form></FormDialog>}
    {endingSessions && <FormDialog title="Encerrar todas as sessões?" description="Todos os dispositivos, incluindo este, precisarão entrar novamente." pending={revoke.isPending} onClose={() => setEndingSessions(false)}><MutationError error={revoke.error} /><DialogFooter><Button variant="outline" disabled={revoke.isPending} onClick={() => setEndingSessions(false)}>Cancelar</Button><Button disabled={revoke.isPending} onClick={() => revoke.mutate()}>{revoke.isPending ? 'Encerrando…' : 'Encerrar sessões'}</Button></DialogFooter></FormDialog>}
  </DashboardShell>;
}
