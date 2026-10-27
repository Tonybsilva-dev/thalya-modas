"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, PageToolbar, Input, Label, Textarea, Checkbox, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@store-flow/ui";
import { apiRequest } from "@/src/shared/api/http-client";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { PageHeading, QueryState, MutationError } from "@/src/features/backoffice/presentation/shared";
import { ListPagination, useRemotePage } from "@/src/features/backoffice/presentation/list-pagination";

type Customer = { id: string; name: string; email?: string; phone?: string; document?: string; notes?: string; status: "ACTIVE" | "INACTIVE" };
type CustomerPage = { items: Customer[]; total: number; page: number; totalPages: number };

export function CustomerRegisterRoute({ detail = false }: { detail?: boolean }) {
  const params = useParams<{ role: string; customerId?: string }>();
  const store = useAppUiStore(state => state.activeStore);
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const pagination = useRemotePage(search);
  const [editor, setEditor] = useState<Customer | "new" | null>(null);
  const list = useQuery({ queryKey: ["customers", store?.id, search, pagination.page], queryFn: () => apiRequest<CustomerPage>(`/customers?${new URLSearchParams({ q: search, page: String(pagination.page), perPage: "20" })}`), placeholderData: keepPreviousData, enabled: !detail });
  const customer = useQuery({ queryKey: ["customer", store?.id, params.customerId], queryFn: () => apiRequest<Customer>(`/customers/${params.customerId}`), enabled: detail && !!params.customerId });
  const mutation = useMutation({ mutationFn: (input: Omit<Customer, "id">) => apiRequest<Customer>(editor && editor !== "new" ? `/customers/${editor.id}` : "/customers", { method: editor === "new" ? "POST" : "PATCH", body: JSON.stringify(input) }), onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ["customers"] }), client.invalidateQueries({ queryKey: ["customer"] })]);
    setEditor(null);
  } });
  function openEditor(value: Customer | "new") { mutation.reset(); setEditor(value); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({ name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), phone: String(data.get("phone") ?? ""), document: String(data.get("document") ?? ""), notes: String(data.get("notes") ?? ""), status: data.get("active") === "on" ? "ACTIVE" : "INACTIVE" });
  }
  const current = detail ? customer : list;
  return <DashboardShell activeItem="Customers" operatorRole="Equipe" status={store?.name ?? "Filial ativa"}>
    <PageHeading title={detail ? customer.data?.name ?? "Cliente" : "Clientes"} description="Cadastro comercial da filial." action={<Button onClick={() => openEditor(detail && customer.data ? customer.data : "new")} disabled={detail && !customer.data}>{detail ? "Editar cliente" : "Novo cliente"}</Button>} />
    <QueryState loading={current.isPending} error={current.error} retry={() => void current.refetch()} />
    {!detail && <>
      {list.data && <Card className="overflow-hidden" aria-busy={list.isFetching}><PageToolbar><div className="grid w-full gap-1.5 sm:max-w-sm"><Label htmlFor="customer-search">Buscar cliente</Label><Input id="customer-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, telefone, documento ou e-mail" /></div></PageToolbar><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>E-mail</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>{list.data.items.map(row => <TableRow key={row.id}><TableCell><Link className="text-primary hover:underline" href={`/${params.role}/dashboard/customers/${row.id}`}>{row.name}</Link></TableCell><TableCell>{row.phone || "—"}</TableCell><TableCell>{row.email || "—"}</TableCell><TableCell>{row.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => openEditor(row)}>Editar<span className="sr-only"> {row.name}</span></Button></TableCell></TableRow>)}</TableBody></Table>{!list.data.items.length && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado. Cadastre o primeiro cliente para começar.</p>}<ListPagination page={list.data.page} total={list.data.total} totalPages={list.data.totalPages} onPageChange={pagination.onPageChange} /></Card>}
    </>}
    {detail && customer.data && <Card className="grid gap-4 p-5"><dl className="grid gap-4 sm:grid-cols-2">{[["Telefone", customer.data.phone], ["E-mail", customer.data.email], ["CPF/CNPJ", customer.data.document], ["Status", customer.data.status === "ACTIVE" ? "Ativo" : "Inativo"], ["Observações", customer.data.notes]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value || "—"}</dd></div>)}</dl><Button asChild className="w-fit"><Link href={`/${params.role}/dashboard/customers/${params.customerId}/promissory`}>Abrir conta e promissórias</Link></Button><Button asChild variant="outline" className="w-fit"><Link href={`/${params.role}/dashboard/customers`}>Voltar aos clientes</Link></Button></Card>}
    <Dialog open={editor !== null} onOpenChange={open => { if (!open && !mutation.isPending) setEditor(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editor === "new" ? "Novo cliente" : "Editar cliente"}</DialogTitle><DialogDescription>O cliente não precisa ter uma conta de acesso.</DialogDescription></DialogHeader>
      <form key={typeof editor === "object" ? editor?.id : "new"} onSubmit={submit} className="grid gap-4" aria-busy={mutation.isPending}>
        {([['name', 'Nome', 'text'], ['phone', 'Telefone', 'tel'], ['email', 'E-mail', 'email'], ['document', 'CPF/CNPJ', 'text']] as const).map(([name, label, type]) => <div className="grid gap-1.5" key={name}><Label htmlFor={`customer-${name}`}>{label}{name === 'name' ? ' *' : ''}</Label><Input id={`customer-${name}`} name={name} type={type} required={name === 'name'} minLength={name === 'name' ? 2 : undefined} maxLength={name === 'name' ? 160 : name === 'email' ? 254 : 30} defaultValue={editor && editor !== 'new' ? editor[name] : ''} /></div>)}
        <div className="grid gap-1.5"><Label htmlFor="customer-notes">Observações</Label><Textarea id="customer-notes" name="notes" maxLength={2000} defaultValue={editor && editor !== 'new' ? editor.notes : ''} /></div>
        <div className="flex items-center gap-2"><Checkbox id="customer-active" name="active" defaultChecked={!editor || editor === 'new' || editor.status === 'ACTIVE'} /><Label htmlFor="customer-active">Cliente ativo</Label></div>
        <MutationError error={mutation.error} />
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Salvando…" : "Salvar cliente"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </DashboardShell>;
}
