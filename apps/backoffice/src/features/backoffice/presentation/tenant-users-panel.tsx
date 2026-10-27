"use client";
import { ListPagination, useRemotePage } from "./list-pagination";
import { Card, EmptyState, EmptyStateContent, EmptyStateDescription, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/shared/api/http-client";
import type { CurrentUser } from "@/src/features/auth/session/application/current-user-api";
import { QueryState, StatusBadge, } from "./shared";
export function TenantUsersPanel({ tenantId }: { tenantId: string }) {
  const pagination = useRemotePage(tenantId);
  const query = useQuery({ queryKey: ["platform", "tenant-users", tenantId,pagination.page], queryFn: () => apiRequest<import("../application/backoffice-api").Page<CurrentUser>>(`/admin/tenants/${tenantId}/users?page=${pagination.page}&perPage=20`) });
  const roles: Record<string, string> = { ROLE_ADMIN: "Administrador", ROLE_MANAGER: "Gerente", ROLE_EMPLOYEE: "Funcionário", ROLE_CUSTOMER: "Cliente", ROLE_SUPER_ADMIN: "Super administrador" };
  return <Card className="">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="font-semibold">Usuários da empresa</h2><p className="mt-1 text-sm text-muted-foreground">Contas com vínculo empresarial, incluindo o administrador.</p></div><Link href="/backoffice/users" className="text-sm text-primary hover:underline">Gerenciar usuários</Link></div>
    <div className="p-5"><QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} /></div>
    {query.data && <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Perfil</TableHead><TableHead>Status da conta</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{query.data.items.map((user) => <TableRow key={user.id}><TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{roles[user.role] ?? user.role}</TableCell><TableCell><StatusBadge status={user.accountStatus} /></TableCell><TableCell><Link className="text-primary hover:underline" href={`/backoffice/users?edit=${user.id}`}>Editar usuário</Link></TableCell></TableRow>)}</TableBody></Table><ListPagination {...query.data} onPageChange={pagination.onPageChange} />{!query.data.total && <EmptyState><EmptyStateContent><EmptyStateDescription>Nenhum usuário vinculado.</EmptyStateDescription></EmptyStateContent></EmptyState>}</div>}
  </Card>;
}
