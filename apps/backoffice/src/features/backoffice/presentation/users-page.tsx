"use client";
import { ListPagination } from "./list-pagination";
import { CheckCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card, PageToolbar, DialogFooter, EmptyState, EmptyStateContent, EmptyStateDescription, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";
import { SelectField, SelectFieldOption } from "./select-field";
import { FormDialog } from "./form-dialog";
import { ActionDialog } from "./action-dialog";
import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/shared/api/http-client";
import {
  getCurrentUser,
  type CurrentUser,
} from "@/src/features/auth/session/application/current-user-api";
import {
  createAdmin,
  listUsers,
  platformKeys,
  updateUser,
} from "../application/backoffice-api";
import {
  MutationError,
  PageHeading,
  QueryState,
  } from "./shared";
const roleLabels: Record<string, string> = {
  ROLE_SUPER_ADMIN: "Super administrador",
  ROLE_ADMIN: "Administrador",
  ROLE_MANAGER: "Gerente",
  ROLE_EMPLOYEE: "Funcionário",
  ROLE_CUSTOMER: "Cliente",
};
export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setFilter(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const [creation, setCreation] = useQueryState("create");
  const showCreate = creation === "1";
  const setShowCreate = (open: boolean) => { void setCreation(open ? "1" : null); };
  const [editingId, setEditingId] = useQueryState("edit");
  const selectedUser = useQuery({ queryKey: [...platformKeys.users, "detail", editingId], queryFn: () => apiRequest<CurrentUser>(`/users/${encodeURIComponent(editingId!)}`), enabled: !!editingId });
  const editing = editingId ? selectedUser.data ?? null : null;
  const setEditing = (user: CurrentUser | null) => { void setEditingId(user?.id ?? null); };
  const [promotion, setPromotion] = useState<{
    id: string;
    name: string;
    email: string;
    role?: string;
    accountStatus?: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const cache = useQueryClient();
  const users = useQuery({
    queryKey: [...platformKeys.users, "list", page, filter],
    queryFn: () => listUsers(page, filter),
  });
  const me = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: getCurrentUser,
  });
  const create = useMutation({
    mutationFn: createAdmin,
    onSuccess: async () => {
      setShowCreate(false);
      setNotice(
        "Administrador cadastrado. Agora você pode vinculá-lo a uma empresa.",
      );
      await cache.invalidateQueries({ queryKey: platformKeys.users });
    },
  });
  const update = useMutation({
    mutationFn: (input: {
      id: string;
      name: string;
      email: string;
      role?: string;
      accountStatus?: string;
    }) => {
      const { id, ...body } = input;
      return updateUser(id, body);
    },
    onSuccess: async () => {
      setEditing(null);
      setPromotion(null);
      setNotice("Usuário atualizado.");
      await cache.invalidateQueries({ queryKey: platformKeys.users });
    },
  });
  const isSelf = editing?.id === me.data?.id;
  return (
    <>
      <PageHeading
        title="Usuários"
        description="Gerencie as contas e permissões globais da plataforma."
        action={
          <Button
            onClick={() => {
              setShowCreate(!showCreate);
              setEditing(null);
              create.reset();
            }}
          >
            {showCreate ? "Fechar cadastro" : "Novo administrador"}
          </Button>
        }
      />
      {editingId && <QueryState loading={selectedUser.isPending} error={selectedUser.error} retry={() => void selectedUser.refetch()} />}
      {notice && (
        <Alert variant="success" role="status" className="mb-5"><CheckCircle aria-hidden="true" /><AlertDescription>
          {notice}
        </AlertDescription></Alert>
      )}
      {showCreate && (
        <FormDialog
          title="Cadastrar ADMIN"
          description="Crie o responsável por uma empresa."
          onClose={() => setShowCreate(false)}
          pending={create.isPending}
        >
          <p className="text-sm text-muted-foreground">
            Esta conta será responsável por uma empresa. O cadastro mantém sua
            sessão de SUPER_ADMIN.
          </p>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              create.mutate({
                name: String(data.get("name")),
                email: String(data.get("email")),
                password: String(data.get("password")),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nome completo</Label>
              <Input id="admin-name" name="name" minLength={2} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">E-mail</Label>
              <Input id="admin-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha inicial</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-3 md:col-span-3">
              <MutationError error={create.error} />
              <DialogFooter><Button disabled={create.isPending} type="submit">
                {create.isPending ? "Cadastrando…" : "Cadastrar administrador"}
              </Button></DialogFooter>
            </div>
          </form>
        </FormDialog>
      )}
      {editing && (
        <FormDialog
          title="Editar usuário"
          description="Alterações de papel e status afetam os acessos em todas as empresas."
          onClose={() => setEditing(null)}
          pending={update.isPending}
        >
          <form
            key={editing.id}
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const role = String(data.get("role"));
              const input = {
                id: editing.id,
                name: String(data.get("name")),
                email: String(data.get("email")),
                ...(!isSelf
                  ? { role, accountStatus: String(data.get("accountStatus")) }
                  : {}),
              };
              if (
                !isSelf &&
                role === "ROLE_SUPER_ADMIN" &&
                editing.role !== role
              )
                setPromotion(input);
              else update.mutate(input);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="user-name">Nome completo</Label>
              <Input
                id="user-name"
                name="name"
                defaultValue={editing.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">E-mail</Label>
              <Input
                id="user-email"
                name="email"
                type="email"
                defaultValue={editing.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Papel</Label>
              <SelectField
                id="user-role"
                name="role"
                disabled={isSelf || !me.data}
                defaultValue={editing.role}
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectFieldOption key={value} value={value}>
                    {label}
                  </SelectFieldOption>
                ))}
              </SelectField>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-status">Status da conta</Label>
              <SelectField
                id="user-status"
                name="accountStatus"
                disabled={isSelf || !me.data}
                defaultValue={editing.accountStatus}
              >
                <SelectFieldOption value="ACTIVE">Ativa</SelectFieldOption>
                <SelectFieldOption value="SUSPENDED">Suspensa</SelectFieldOption>
                <SelectFieldOption value="INACTIVE">Inativa</SelectFieldOption>
                <SelectFieldOption value="PENDING_VERIFICATION">Verificação pendente</SelectFieldOption>
              </SelectField>
            </div>
            <div className="space-y-3 md:col-span-2">
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  Seu papel e status estão protegidos para evitar perder o
                  acesso administrativo.
                </p>
              )}
              <MutationError error={update.error} />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
                <Button disabled={update.isPending || !me.data} type="submit">
                  Salvar alterações
                </Button>
              </DialogFooter>
            </div>
          </form>
        </FormDialog>
      )}
      <Card className="overflow-hidden">
      <PageToolbar>
      <form
        aria-label="Buscar usuários"
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter(search);
          setPage(1);
        }}
      >
        <div className="w-full space-y-1.5 sm:max-w-sm"><Label htmlFor="users-search">Buscar usuário</Label>
        <Input
          id="users-search"
          aria-label="Buscar usuário"
          placeholder="Buscar por nome ou e-mail"
          className="max-w-md"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
        </div>
        {search && <Button variant="outline" type="button" onClick={() => { setSearch(""); setFilter(""); setPage(1); }}>Limpar busca</Button>}
      </form>
      </PageToolbar>
      <QueryState
        inline
        loading={users.isPending}
        error={users.error}
        retry={() => void users.refetch()}
      />
      {users.data && (
        <>
          <div className="overflow-x-auto" aria-busy={users.isFetching}>
            {!users.data.items.length ? (
              <EmptyState><EmptyStateContent><EmptyStateDescription>
                Nenhum usuário encontrado.
              </EmptyStateDescription></EmptyStateContent></EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </TableCell>
                      <TableCell>{roleLabels[user.role] ?? user.role}</TableCell>
                      <TableCell>
                        {user.accountStatus === "ACTIVE" ? "Ativa" : "Suspensa"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(user);
                            setShowCreate(false);
                            update.reset();
                            setNotice("");
                          }}
                        >
                          Editar<span className="sr-only"> {user.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <ListPagination {...users.data} onPageChange={setPage} disabled={users.isFetching} />
        </>
      )}
      </Card>
      <ActionDialog
        open={!!promotion}
        title="Conceder acesso SUPER_ADMIN?"
        description="Esta conta poderá administrar todas as empresas, planos e permissões da plataforma."
        requireReason={false}
        pending={update.isPending}
        error={update.error}
        onClose={() => setPromotion(null)}
        onConfirm={() => {
          if (promotion) update.mutate(promotion);
        }}
      />
    </>
  );
}
