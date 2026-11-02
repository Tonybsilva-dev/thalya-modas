"use client";
import { ListPagination, useRemotePage } from "./list-pagination";
import { Button, Card, PageToolbar, DialogFooter, EmptyState, EmptyStateContent, EmptyStateDescription, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";
import { SelectField, SelectFieldOption } from "./select-field";
import { FormDialog } from "./form-dialog";
import { useState } from "react";
import { useQueryState } from "nuqs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTenant,
  listTenants,
  listOwners,
  platformKeys,
} from "../application/backoffice-api";
import {
  MutationError,
  PageHeading,
  QueryState,
  StatusBadge,
  } from "./shared";
export function TenantsPage() {
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const pagination = useRemotePage(`${filter}|${status}`);
  const [creation, setCreation] = useQueryState("create");
  const showForm = creation === "1";
  const setShowForm = (open: boolean) => { void setCreation(open ? "1" : null); };
  const router = useRouter();
  const cache = useQueryClient();
  const tenants = useQuery({
    queryKey: [...platformKeys.tenants,pagination.page,filter,status],
    queryFn: () => listTenants(pagination.page,filter,status),
  });
  const owners = useQuery({
    queryKey: [...platformKeys.users, "owners"],
    queryFn: listOwners,
    enabled: showForm,
  });
  const create = useMutation({
    mutationFn: createTenant,
    onSuccess: async (tenant) => {
      await cache.invalidateQueries({ queryKey: platformKeys.tenants });
      router.push(`/backoffice/tenants/${tenant.id}`);
    },
  });
  const rows = tenants.data?.items;
  const loading = tenants.isPending;
  const error = tenants.error;
  return (
    <>
      <PageHeading
        title="Empresas"
        description="Encontre uma empresa e acesse diretamente suas filiais e seu plano."
        action={
          <Button
            onClick={() => {
              setShowForm(!showForm);
              create.reset();
            }}
          >
            {showForm ? "Fechar cadastro" : "Nova empresa"}
          </Button>
        }
      />
      {showForm && (
        <FormDialog
          title="Cadastrar empresa"
          description="Escolha um ADMIN ativo. Você poderá cadastrar as filiais e definir o plano em seguida."
          onClose={() => setShowForm(false)}
          pending={create.isPending}
        >
          <QueryState
            loading={owners.isPending}
            error={owners.error}
            retry={() => void owners.refetch()}
          />
          {owners.data &&
            (owners.data.length ? (
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  create.mutate({
                    name: String(data.get("name")),
                    ownerId: String(data.get("ownerId")),
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da empresa</Label>
                  <Input id="company-name" name="name" minLength={2} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-owner">
                    Administrador responsável
                  </Label>
                  <SelectField
                    id="company-owner"
                    name="ownerId"
                    required
                    defaultValue=""
                  >
                    <SelectFieldOption value="" disabled>
                      Selecione um ADMIN ativo
                    </SelectFieldOption>
                    {owners.data.map((user) => (
                      <SelectFieldOption value={user.id} key={user.id}>
                        {user.name} · {user.email}
                      </SelectFieldOption>
                    ))}
                  </SelectField>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <MutationError error={create.error} />
                  <DialogFooter><Button disabled={create.isPending} type="submit">
                    {create.isPending ? "Criando…" : "Criar empresa"}
                  </Button></DialogFooter>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cadastre primeiro um ADMIN ativo em{" "}
                <Link
                  className="text-primary underline"
                  href="/backoffice/users"
                >
                  Usuários
                </Link>
                .
              </p>
            ))}
        </FormDialog>
      )}
      <Card className="overflow-hidden">
      <PageToolbar>
        <div className="w-full space-y-1.5 sm:max-w-sm"><Label className="shrink-0" htmlFor="tenant-search">Buscar empresa</Label>
        <Input
          id="tenant-search"
          aria-label="Buscar empresa"
          placeholder="Buscar empresa pelo nome"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-md"
        />
        </div>
        <div className="ml-auto w-full sm:w-52"><Label className="sr-only" htmlFor="tenant-status">Status da empresa</Label>
        <SelectField
          id="tenant-status"
          aria-label="Filtrar status"
          className="max-w-48"
          value={status}
          onValueChange={(value) => setStatus(value)}
        >
          <SelectFieldOption value="">Todos os status</SelectFieldOption>
          <SelectFieldOption value="ACTIVE">Ativas</SelectFieldOption>
          <SelectFieldOption value="SUSPENDED">Suspensas</SelectFieldOption>
        </SelectField>
        </div>
        {(filter || status) && <Button variant="outline" onClick={() => { setFilter(""); setStatus(""); }}>Limpar filtros</Button>}
      </PageToolbar>
      {rows && <p role="status" className="border-b px-4 py-2 text-xs text-muted-foreground">{tenants.data?.total} empresas encontradas</p>}
      <QueryState
        inline
        loading={loading}
        error={error}
        retry={() => {
          void tenants.refetch();
        }}
      />
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
          {!rows?.length ? (
            <EmptyState><EmptyStateContent><EmptyStateDescription>
              {tenants.data?.total
                ? "Nenhuma empresa corresponde aos filtros."
                : "Nenhuma empresa cadastrada. Crie a primeira empresa para adicionar suas filiais."}
            </EmptyStateDescription></EmptyStateContent></EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Filiais</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrada em</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium"><Link href={`/backoffice/tenants/${t.id}`} className="text-primary hover:underline">{t.name}</Link></TableCell>
                    <TableCell>
                      <Link href={`/backoffice/tenants/${t.id}?tab=branches`} className="text-primary hover:underline" aria-label={`Ver filiais de ${t.name}`}>{t.branchCount}</Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link
                        href={`/backoffice/tenants/${t.id}`}
                        className="text-primary hover:underline"
                      >
                        Gerenciar
                      </Link>
                      <Link href={`/backoffice/tenants/${t.id}?tab=branches`} className="text-primary hover:underline">Filiais</Link>
                      <Link href={`/backoffice/tenants/${t.id}?tab=plan`} className="text-primary hover:underline">Plano</Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </div>
          {tenants.data && <ListPagination {...tenants.data} onPageChange={pagination.onPageChange} disabled={tenants.isFetching} />}
        </>
      )}
      </Card>
    </>
  );
}
