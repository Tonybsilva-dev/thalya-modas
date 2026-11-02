"use client";
import { ListPagination, useRemotePage } from "./list-pagination";
import { Avatar } from "@store-flow/ui";
import { CheckCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card, DialogFooter, EmptyState, EmptyStateContent, EmptyStateDescription, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "@store-flow/ui";
import { SelectField, SelectFieldOption } from "./select-field";
import { ActionDialog } from "./action-dialog";
import { FormDialog } from "./form-dialog";
import { TenantPlanPanel } from "./tenant-plan-panel";
import { TenantUsersPanel } from "./tenant-users-panel";
import { AuditHistory } from "./audit-page";
import { auditKeys } from "../application/plans-api";
import Link from "next/link";
import { useState } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/shared/api/http-client";
import type { CurrentUser } from "@/src/features/auth/session/application/current-user-api";
import {
  createBranch,
  getTenant,
  listTenantBranches,
  platformKeys,
  updateTenant,
} from "../application/backoffice-api";
import {
  MutationError,
  PageHeading,
  QueryState,
  StatusBadge,
  } from "./shared";
export function TenantDetailPage({ tenantId }: { tenantId: string }) {
  const branchPagination = useRemotePage(tenantId);
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(["account", "branches", "users", "plan", "history"] as const).withDefault("account"));
  const [showForm, setShowForm] = useState(false);
  const [statusAction, setStatusAction] = useState<
    "ACTIVE" | "SUSPENDED" | null
  >(null);
  const [notice, setNotice] = useState("");
  const cache = useQueryClient();
  const tenant = useQuery({
    queryKey: [...platformKeys.tenants, tenantId],
    queryFn: () => getTenant(tenantId),
  });
  const branches = useQuery({
    queryKey: [...platformKeys.branches, tenantId,branchPagination.page],
    queryFn: () => listTenantBranches(tenantId,branchPagination.page),
  });
  const owner = useQuery({
    queryKey: [...platformKeys.users, tenant.data?.ownerId],
    queryFn: () => apiRequest<CurrentUser>(`/users/${tenant.data!.ownerId}`),
    enabled: !!tenant.data,
  });
  const update = useMutation({
    mutationFn: (input: { name?: string; status?: "ACTIVE" | "SUSPENDED"; reason?: string }) =>
      updateTenant(tenantId, input),
    onSuccess: async () => {
      setNotice("Empresa atualizada.");
      setStatusAction(null);
      await cache.invalidateQueries({ queryKey: platformKeys.tenants });
      await cache.invalidateQueries({ queryKey: auditKeys });
    },
  });
  const create = useMutation({
    mutationFn: (input: {
      name: string;
      phone: string;
      document: string;
      segment: string;
    }) => createBranch(tenantId, input),
    onSuccess: async () => {
      setShowForm(false);
      setNotice("Filial cadastrada.");
      await cache.invalidateQueries({ queryKey: platformKeys.branches });
      await cache.invalidateQueries({ queryKey: auditKeys });
    },
  });
  const loading = tenant.isPending || branches.isPending;
  const error = tenant.error ?? branches.error;
  return (
    <>
      <Link
        href="/backoffice/tenants"
        className="mb-5 inline-block text-sm text-primary hover:underline"
      >
        ← Empresas
      </Link>
      <PageHeading
        title={tenant.data?.name ?? "Detalhes da empresa"}
        description="Administre a empresa e acompanhe suas filiais."
        action={<Button disabled={!tenant.data} onClick={() => { void setTab("branches"); setShowForm(true); create.reset(); }}>Nova filial</Button>}
      />
      <QueryState
        loading={loading}
        error={error}
        retry={() => {
          void tenant.refetch();
          void branches.refetch();
        }}
      />
      {!loading && !error && tenant.data && (
        <>
          {notice && (
            <Alert variant="success" role="status" className="mb-5"><CheckCircle aria-hidden="true" /><AlertDescription>
              {notice}
            </AlertDescription></Alert>
          )}
          <Card className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="size-16 border text-lg" aria-hidden="true" initials={tenant.data.name} />
              <div><p className="font-semibold">{tenant.data.name}</p><p className="text-xs text-muted-foreground">Logo da empresa</p></div>
            </div>
            <StatusBadge status={tenant.data.status} />
            <span>{branches.data?.total ?? 0} filiais</span>
            <span className="text-muted-foreground">{owner.data?.name ?? "Carregando responsável…"}</span>
          </Card>
          <Tabs value={tab} onValueChange={(value) => { void setTab(value as typeof tab); }}>
            <TabsList aria-label="Detalhes da empresa" className="flex h-auto w-full flex-wrap justify-start gap-1 border-b p-1">
              <TabsTrigger value="account">Conta</TabsTrigger>
              <TabsTrigger value="branches">Filiais ({branches.data?.total ?? 0})</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="plan">Plano e funcionalidades</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
          <TabsContent value="account">
          <Card className="mb-6 grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold">Empresa</h2>
                <StatusBadge status={tenant.data.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                Administrador:{" "}
                {owner.data
                  ? `${owner.data.name} · ${owner.data.email}`
                  : owner.isError
                    ? "Não foi possível carregar o responsável."
                    : "Carregando…"}
              </p>
              <form
                key={tenant.data.updatedAt}
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  update.mutate({
                    name: String(new FormData(e.currentTarget).get("name")),
                  });
                }}
              >
                <Label htmlFor="tenant-name">Nome da empresa</Label>
                <Input
                  id="tenant-name"
                  name="name"
                  minLength={2}
                  required
                  defaultValue={tenant.data.name}
                />
                <Button
                  variant="outline"
                  type="submit"
                  disabled={update.isPending}
                >
                  Salvar nome
                </Button>
              </form>
            </div>
            <div className="space-y-4">
              <h2 className="font-semibold">Acesso à plataforma</h2>
              <p className="text-sm text-muted-foreground">
                Suspender a empresa bloqueia o acesso operacional dos membros em
                todas as filiais. Os dados permanecem preservados.
              </p>
              <Button
                variant={
                  tenant.data.status === "ACTIVE" ? "outline" : "default"
                }
                disabled={update.isPending}
                onClick={() => {
                  const nextStatus =
                    tenant.data!.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                  update.reset();
                  setStatusAction(nextStatus);
                }}
              >
                {tenant.data.status === "ACTIVE"
                  ? "Suspender empresa"
                  : "Reativar empresa"}
              </Button>
              <MutationError error={update.error} />
            </div>
          </Card>
          </TabsContent>
          <TabsContent value="plan"><TenantPlanPanel tenantId={tenantId} /></TabsContent>
          <TabsContent value="users"><TenantUsersPanel tenantId={tenantId} /></TabsContent>
          <TabsContent value="history"><AuditHistory targetId={tenantId} /></TabsContent>
          <TabsContent value="branches">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b p-5">
              <div>
                <h2 className="font-semibold">Filiais</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {branches.data?.total ?? 0} filiais vinculadas à empresa
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowForm(!showForm);
                  create.reset();
                }}
              >
                {showForm ? "Fechar cadastro" : "Nova filial"}
              </Button>
            </div>
            {showForm && (
              <FormDialog
                title="Cadastrar filial"
                description="Esta filial herda a empresa e seu plano, mantendo estoque e catálogo próprios."
                onClose={() => setShowForm(false)}
                pending={create.isPending}
              >
                <form
                  className="grid gap-4 border-b p-5 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    create.mutate({
                      name: String(data.get("name")),
                      phone: String(data.get("phone")),
                      document: String(data.get("document")),
                      segment: String(data.get("segment")),
                    });
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="branch-name">Nome da filial</Label>
                    <Input
                      id="branch-name"
                      name="name"
                      minLength={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-phone">Telefone</Label>
                    <Input
                      id="branch-phone"
                      name="phone"
                      type="tel"
                      minLength={10}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-document">CPF / CNPJ</Label>
                    <Input
                      id="branch-document"
                      name="document"
                      minLength={11}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-segment">Segmento</Label>
                    <SelectField
                      id="branch-segment"
                      name="segment"
                      defaultValue="mixed"
                    >
                      <SelectFieldOption value="fashion">Moda</SelectFieldOption>
                      <SelectFieldOption value="accessories">Acessórios</SelectFieldOption>
                      <SelectFieldOption value="footwear">Calçados</SelectFieldOption>
                      <SelectFieldOption value="mixed">Misto</SelectFieldOption>
                    </SelectField>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <MutationError error={create.error} />
                    <DialogFooter><Button disabled={create.isPending} type="submit">
                      {create.isPending ? "Cadastrando…" : "Cadastrar filial"}
                    </Button></DialogFooter>
                  </div>
                </form>
              </FormDialog>
            )}
            {!branches.data?.total ? (
              <EmptyState><EmptyStateContent><EmptyStateDescription>
                Nenhuma filial cadastrada. Adicione a primeira filial desta
                empresa.
              </EmptyStateDescription></EmptyStateContent></EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filial</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.data?.items.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.document}</TableCell>
                        <TableCell>{b.phone}</TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {branches.data && <ListPagination {...branches.data} onPageChange={branchPagination.onPageChange} />}
              </div>
            )}
          </Card>
          </TabsContent>
          </Tabs>
        </>
      )}
      <ActionDialog
        open={!!statusAction}
        title={
          statusAction === "SUSPENDED"
            ? "Suspender empresa?"
            : "Reativar empresa?"
        }
        description={
          statusAction === "SUSPENDED"
            ? "O acesso operacional será bloqueado em todas as filiais. Os dados serão preservados."
            : "O acesso operacional volta a seguir o plano e os vínculos ativos."
        }
        requireReason
        pending={update.isPending}
        error={update.error}
        onClose={() => setStatusAction(null)}
        onConfirm={(reason) => {
          if (statusAction) update.mutate({ status: statusAction, reason });
        }}
      />
    </>
  );
}
