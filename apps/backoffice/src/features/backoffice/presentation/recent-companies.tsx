"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, EmptyState, EmptyStateContent, EmptyStateDescription, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";
import { listTenants, platformKeys } from "../application/backoffice-api";
import { QueryState, StatusBadge } from "./shared";
export function RecentCompanies() {
 const tenants=useQuery({queryKey:[...platformKeys.tenants,"recent"],queryFn:()=>listTenants(1,"","",5)});
 return <><QueryState loading={tenants.isPending} error={tenants.error} retry={()=>void tenants.refetch()} />{tenants.data && (
          <Card className="overflow-hidden">
            <div className="flex justify-between gap-4 border-b p-5">
              <h2 className="font-semibold">Empresas recentes</h2>
              <Link
                className="text-sm text-primary hover:underline"
                href="/backoffice/tenants"
              >
                Ver todas
              </Link>
            </div>
            {!tenants.data?.total ? (
              <div className="space-y-3 p-8">
                <EmptyState><EmptyStateContent><EmptyStateDescription>Nenhuma empresa cadastrada.</EmptyStateDescription></EmptyStateContent></EmptyState>
                <p className="text-sm text-muted-foreground">
                  Cadastre um administrador e crie a primeira empresa com suas
                  filiais.
                </p>
                <Link
                  href="/backoffice/users"
                  className="text-sm text-primary hover:underline"
                >
                  Gerenciar usuários
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Filiais</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...tenants.data.items]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .slice(0, 5)
                      .map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell>
                            <Link
                              href={`/backoffice/tenants/${tenant.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {tenant.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {
                              tenant.branchCount
                            }
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={tenant.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
 )}</>;
}
