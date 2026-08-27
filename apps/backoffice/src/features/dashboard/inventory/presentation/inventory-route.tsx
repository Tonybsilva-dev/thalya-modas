"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import {
  Barcode,
  Camera,
  DotsThreeVertical,
  Package,
  PencilSimple,
  Plus,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@thalya-modas/ui";

import { listAllSuppliers } from "../../suppliers/application/suppliers-api";
import { useInventoryFilters } from "../../shared/application/dashboard-filters";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import {
  findProductByBarcode,
  type Product,
  useProductsQuery,
} from "../application/products-api";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";

const filters = [
  ["all", "Todos"],
  ["tracked", "Estoque controlado"],
  ["untracked", "Avulsos (U)"],
  ["low", "Abaixo do mínimo"],
  ["inactive", "Inativos"],
] as const;

function formatCurrency(value?: number) {
  if (value === undefined) return "Não informado";
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(value);
}

function displayName(product: Product) {
  return product.inventoryControl === "untracked" ? `(U) ${product.name}` : product.name;
}

function useInventoryBasePath() {
  const params = useParams<{ role?: string }>();
  return `/${params.role ?? "manager"}/dashboard/inventory`;
}

export function InventoryRoute() {
  const basePath = useInventoryBasePath();
  const router = useRouter();
  const { q, setQ, setStatus, status } = useInventoryFilters();
  const [selectedId, setSelectedId] = useQueryState("selected");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string>();
  const productsQuery = useProductsQuery({ q, perPage: 100 });
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "product-options"],
    queryFn: () => listAllSuppliers(),
    staleTime: 60_000,
  });
  const supplierNames = useMemo(
    () => new Map((suppliersQuery.data ?? []).map((supplier) => [supplier.id, supplier.name])),
    [suppliersQuery.data],
  );
  const products = productsQuery.data ?? [];
  const filteredProducts = products.filter((product) => {
    if (status === "tracked") return product.inventoryControl === "tracked" && product.status === "active";
    if (status === "untracked") return product.inventoryControl === "untracked" && product.status === "active";
    if (status === "low") return product.inventoryControl === "tracked" && product.status === "active" && product.currentStock <= product.minimumStock;
    if (status === "inactive") return product.status === "inactive";
    return true;
  });
  const selected = products.find((product) => product.id === selectedId) ?? filteredProducts[0];
  const activeProducts = products.filter((product) => product.status === "active");
  const trackedProducts = activeProducts.filter((product) => product.inventoryControl === "tracked");
  const metrics = [
    { description: `${activeProducts.length} ativos`, icon: Package, label: "Produtos", value: products.length.toString() },
    { description: "Somente itens controlados", icon: Barcode, label: "Unidades em estoque", value: trackedProducts.reduce((sum, product) => sum + product.currentStock, 0).toString() },
    { description: "Requerem acompanhamento", icon: WarningCircle, label: "Abaixo do mínimo", value: trackedProducts.filter((product) => product.currentStock <= product.minimumStock).length.toString() },
    { description: "Venda sem limite de saldo", icon: DotsThreeVertical, label: "Produtos avulsos", value: activeProducts.filter((product) => product.inventoryControl === "untracked").length.toString() },
  ];

  async function handleScannedCode(code: string) {
    setScanError(undefined);
    try {
      const product = await findProductByBarcode(code);
      router.push(
        product
          ? `${basePath}/products/${product.id}/edit`
          : `${basePath}/products/create?barcode=${encodeURIComponent(code)}`,
      );
    } catch {
      setScanError("Não foi possível consultar o código agora. Tente novamente ou cadastre manualmente.");
    }
  }

  return (
    <DashboardShell activeItem="Inventory" operatorRole="Gestão de catálogo" status="Produtos e estoque">
      <header className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="grid min-w-0 gap-1.5">
          <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-[28px]">Produtos e estoque</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Cadastre produtos, leia etiquetas, associe fornecedores e acompanhe apenas os itens que precisam de controle de saldo.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button className="h-11" onClick={() => setScannerOpen(true)} variant="secondary">
            <Camera aria-hidden="true" className="size-4" />
            Escanear código
          </Button>
          <Button asChild className="h-11"><Link href={`${basePath}/products/create`}><Plus aria-hidden="true" className="size-4" />Novo produto</Link></Button>
        </div>
      </header>

      {scanError && <Alert variant="destructive"><WarningCircle aria-hidden="true" /><AlertDescription>{scanError}</AlertDescription></Alert>}

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ description, icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-center gap-3"><p className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</p><div className="flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground"><Icon aria-hidden="true" className="size-4" /></div></div>
              <strong className="text-[26px] font-semibold leading-none text-foreground">{value}</strong>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="min-w-0">
        <CardContent className="grid min-w-0 gap-4 p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid gap-1"><h2 className="text-lg font-semibold text-foreground">Catálogo da loja</h2><p className="text-sm text-muted-foreground">Produtos cadastrados e sua situação atual.</p></div>
            <Input className="h-10 w-full lg:max-w-sm" onChange={(event) => void setQ(event.target.value || null)} placeholder="Buscar nome, SKU ou código de barras" value={q} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(([value, label]) => (
              <Button className={cn("h-9 shrink-0 px-3", status === value && "bg-secondary")} key={value} onClick={() => void setStatus(value === "all" ? null : value)} variant={status === value || (value === "all" && status === "all") ? "secondary" : "outline"}>{label}</Button>
            ))}
          </div>

          {productsQuery.isLoading ? (
            <div className="min-h-56 p-6 text-sm text-muted-foreground">Carregando produtos…</div>
          ) : productsQuery.isError ? (
            <Alert variant="destructive"><WarningCircle aria-hidden="true" /><AlertDescription>Não foi possível carregar os produtos.</AlertDescription></Alert>
          ) : filteredProducts.length === 0 ? (
            <EmptyState>
              <EmptyStateContent>
                <EmptyStateIcon><Package aria-hidden="true" /></EmptyStateIcon>
                <EmptyStateTitle>{products.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}</EmptyStateTitle>
                <EmptyStateDescription>{products.length === 0 ? "Comece lendo uma etiqueta ou cadastrando o primeiro produto manualmente." : "Altere a busca ou os filtros para visualizar outros produtos."}</EmptyStateDescription>
                <EmptyStateActions>
                  <Button onClick={() => setScannerOpen(true)} variant="secondary"><Camera aria-hidden="true" className="size-4" />Escanear</Button>
                  <Button asChild><Link href={`${basePath}/products/create`}><Plus aria-hidden="true" className="size-4" />Cadastrar produto</Link></Button>
                </EmptyStateActions>
              </EmptyStateContent>
            </EmptyState>
          ) : (
            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Código</TableHead><TableHead>Fornecedor</TableHead><TableHead>Saldo</TableHead><TableHead>Venda</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow className={cn("cursor-pointer", selected?.id === product.id && "bg-muted/60")} key={product.id} onClick={() => void setSelectedId(product.id)}>
                        <TableCell><div className="grid gap-0.5"><strong className="max-w-[260px] truncate text-foreground">{displayName(product)}</strong><span className="text-xs text-muted-foreground">{product.sku}</span></div></TableCell>
                        <TableCell className="text-muted-foreground">{product.barcode ?? "—"}</TableCell>
                        <TableCell className="max-w-44 truncate text-muted-foreground">{product.supplierId ? supplierNames.get(product.supplierId) ?? "Fornecedor" : "Sem fornecedor"}</TableCell>
                        <TableCell>{product.inventoryControl === "untracked" ? <span className="text-muted-foreground">Sem limite</span> : product.currentStock}</TableCell>
                        <TableCell>{formatCurrency(product.salePrice)}</TableCell>
                        <TableCell><Badge variant={product.status === "active" ? "success" : "outline"}>{product.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                        <TableCell className="text-right"><Button asChild className="size-9 p-0" onClick={(event) => event.stopPropagation()} variant="ghost"><Link aria-label={`Editar ${product.name}`} href={`${basePath}/products/${product.id}/edit`}><PencilSimple aria-hidden="true" className="size-4" /></Link></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selected && (
                <aside className="grid min-w-0 content-start gap-3">
                  <Card className="bg-secondary text-secondary-foreground"><CardContent className="grid gap-3 p-4"><div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center bg-primary text-primary-foreground">{selected.inventoryControl === "untracked" ? "U" : <Package aria-hidden="true" className="size-5" />}</div><div className="min-w-0"><h3 className="break-words font-semibold">{displayName(selected)}</h3><p className="text-xs opacity-80">{selected.sku}</p></div></div><p className="text-sm opacity-90">{selected.description || "Sem descrição cadastrada."}</p></CardContent></Card>
                  <Card><CardContent className="grid gap-3 p-4"><h3 className="font-semibold text-foreground">Resumo comercial</h3><div className="grid gap-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Custo</span><strong>{formatCurrency(selected.costPrice)}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Venda</span><strong>{formatCurrency(selected.salePrice)}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Estoque</span><strong>{selected.inventoryControl === "untracked" ? "Não controlado" : `${selected.currentStock} un.`}</strong></div></div><Button asChild className="mt-1"><Link href={`${basePath}/products/${selected.id}/edit`}><PencilSimple aria-hidden="true" className="size-4" />Editar produto</Link></Button></CardContent></Card>
                </aside>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <BarcodeScannerDialog onCode={(code) => void handleScannedCode(code)} onOpenChange={setScannerOpen} open={scannerOpen} />
    </DashboardShell>
  );
}
