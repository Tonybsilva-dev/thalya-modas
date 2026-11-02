"use client";
import Link from "next/link";
import { Barcode, Camera, List, MagnifyingGlass, Package, PencilSimple, Plus, SquaresFour, WarningCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Badge, Button, Card, EmptyState, EmptyStateContent, EmptyStateDescription, EmptyStateTitle, IconButton, Input, Label, PageHeader, PageToolbar, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";
import { ProductPreview } from "@/src/shared/ui/product-preview";
import { SelectField, SelectFieldOption } from "@/src/features/backoffice/presentation/select-field";
import { ListPagination } from "@/src/features/backoffice/presentation/list-pagination";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import type { Product } from "../application/products-api";

type View = "table" | "catalog";
type Props = {
  basePath: string;
  products: Product[];
  selected?: Product;
  supplierNames: ReadonlyMap<string, string>;
  metrics: { label: string; value: string; description: string }[];
  pagination?: { page: number; perPage: number; total: number; totalPages: number };
  q: string;
  status: string | null;
  view: View;
  loading: boolean;
  fetching: boolean;
  failed: boolean;
  scanError?: string;
  onSearch: (value: string) => void;
  onFilter: (value: string) => void;
  onViewChange: (view: View) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onScan: () => void;
  onRetry: () => void;
};
const filters = [["all", "Todos os produtos"], ["tracked", "Estoque controlado"], ["untracked", "Avulsos (U)"], ["low", "Abaixo do mínimo"], ["inactive", "Inativos"]];
const money = (value?: number) => value === undefined ? "Não informado" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const name = (product: Product) => `${product.inventoryControl === "untracked" ? "(U) " : ""}${product.name}`;
function StockBadge({ product }: { product: Product }) {
  if (product.status === "inactive") return <Badge variant="secondary">Inativo</Badge>;
  if (product.inventoryControl === "untracked") return <Badge variant="info">Avulso</Badge>;
  if (product.currentStock <= 0) return <Badge variant="error">Sem estoque</Badge>;
  if (product.currentStock <= product.minimumStock) return <Badge variant="warning">Estoque baixo</Badge>;
  return <Badge variant="success">Em estoque</Badge>;
}
export function InventoryWorkspace(props: Props) {
  const { basePath, products, selected, metrics, pagination, loading, fetching, failed, view } = props;
  const lowStock = products.filter(product => product.status === "active" && product.inventoryControl === "tracked" && product.currentStock <= product.minimumStock).slice(0, 3);
  return <DashboardShell activeItem="Inventory" operatorRole="Gestão de catálogo" status="Produtos e estoque">
    <PageHeader title="Produtos e estoque" description="Seu catálogo, disponibilidade e reposição em um só lugar." actions={<Button onClick={props.onScan} variant="outline"><Camera aria-hidden="true" />Escanear código</Button>} primaryAction={<Button asChild><Link href={`${basePath}/products/create`}><Plus aria-hidden="true" />Novo produto</Link></Button>} />
    {props.scanError && <Alert variant="destructive"><WarningCircle aria-hidden="true" /><AlertDescription>{props.scanError}</AlertDescription></Alert>}
    <section aria-label="Indicadores do estoque" aria-busy={fetching} tabIndex={0} className="grid auto-cols-[minmax(240px,80vw)] grid-flow-col auto-rows-fr gap-4 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
      {metrics.map((metric, index) => <StatCard key={metric.label} tone={(["brand", "mint", "rose", "amber"] as const)[index % 4]} label={metric.label} value={failed ? "—" : metric.value} hint={metric.description} loading={loading} icon={index === 0 ? <Package /> : index === 1 ? <Barcode /> : undefined} />)}
    </section>
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0 overflow-hidden">
        <div className="px-5 pt-5"><h2 className="text-base font-medium">Catálogo da filial</h2><p className="mt-1 text-xs text-muted-foreground">Encontre produtos e consulte a disponibilidade.</p></div>
        <PageToolbar className="border-0">
          <div className="grid min-w-0 flex-1 gap-1.5"><Label className="sr-only" htmlFor="inventory-search">Buscar produto</Label><Input id="inventory-search" prefix={<MagnifyingGlass aria-hidden="true" />} value={props.q} placeholder="Nome, SKU ou código de barras" onChange={event => props.onSearch(event.target.value)} /></div>
          <div className="w-full sm:w-48"><Label className="sr-only" htmlFor="inventory-status">Filtrar estoque</Label><SelectField id="inventory-status" value={props.status ?? "all"} onValueChange={props.onFilter}>{filters.map(([value, label]) => <SelectFieldOption key={value} value={value}>{label}</SelectFieldOption>)}</SelectField></div>
          <div className="flex gap-1" role="group" aria-label="Visualização do catálogo"><IconButton aria-label="Exibir lista" aria-pressed={view === "table"} variant={view === "table" ? "default" : "ghost"} onClick={() => props.onViewChange("table")}><List /></IconButton><IconButton aria-label="Exibir catálogo com imagens" aria-pressed={view === "catalog"} variant={view === "catalog" ? "default" : "ghost"} onClick={() => props.onViewChange("catalog")}><SquaresFour /></IconButton></div>
        </PageToolbar>
        {loading ? <p className="px-5 py-12 text-sm text-muted-foreground" role="status">Carregando produtos…</p> : failed ? <div className="p-5"><Alert variant="destructive"><WarningCircle aria-hidden="true" /><div><AlertDescription>Não foi possível carregar os produtos.</AlertDescription><Button variant="outline" onClick={props.onRetry}>Tentar novamente</Button></div></Alert></div> : !products.length ? <EmptyState className="m-4"><EmptyStateContent><EmptyStateTitle>Nenhum produto encontrado</EmptyStateTitle><EmptyStateDescription>Ajuste a busca ou cadastre um produto para começar.</EmptyStateDescription><Button asChild><Link href={`${basePath}/products/create`}>Cadastrar produto</Link></Button></EmptyStateContent></EmptyState> : view === "catalog" ? <div className="grid grid-cols-2 gap-3 px-4 pb-4 lg:grid-cols-3" aria-busy={fetching}>
          {products.map(product => <article key={product.id} className="grid content-start gap-3 rounded-[20px] border border-border/40 bg-background p-3"><ProductPreview src={product.images[0]?.publicUrl} name={product.name} /><button type="button" className="text-left text-sm font-medium" aria-pressed={selected?.id === product.id} aria-controls="inventory-product-details" onClick={() => props.onSelect(product.id)}>{name(product)}</button><p className="text-xs text-muted-foreground">{product.sku}</p><div className="flex flex-wrap items-baseline justify-between gap-1"><strong className="text-sm tabular-nums">{money(product.salePrice)}</strong><span className="text-xs text-info-foreground">{product.inventoryControl === "untracked" ? "Avulso" : `${product.currentStock} un.`}</span></div><Button asChild size="sm" variant="outline"><Link href={`${basePath}/products/${product.id}/edit`}><PencilSimple aria-hidden="true" />Editar<span className="sr-only"> {product.name}</span></Link></Button></article>)}
        </div> : <div className="overflow-x-auto pb-3" aria-busy={fetching}><Table className="min-w-[700px]"><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Fornecedor</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Venda</TableHead><TableHead>Situação</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>
          {products.map(product => <TableRow key={product.id} data-state={selected?.id === product.id ? "selected" : undefined}><TableCell><div className="flex items-center gap-3"><ProductPreview src={product.images[0]?.publicUrl} name={product.name} className="size-11 shrink-0" /><div className="min-w-0"><button type="button" aria-pressed={selected?.id === product.id} aria-controls="inventory-product-details" onClick={() => props.onSelect(product.id)} className="text-left text-sm font-medium">{name(product)}</button><p className="mt-0.5 text-xs text-muted-foreground">{product.sku} · {product.barcode ?? "Sem código de barras"}</p></div></div></TableCell><TableCell className="text-muted-foreground">{product.supplierId ? props.supplierNames.get(product.supplierId) ?? "Fornecedor" : "Sem fornecedor"}</TableCell><TableCell className="text-right">{product.inventoryControl === "untracked" ? "Sem limite" : product.currentStock}</TableCell><TableCell className="whitespace-nowrap text-right">{money(product.salePrice)}</TableCell><TableCell><StockBadge product={product} /></TableCell><TableCell><IconButton asChild aria-label={`Editar ${product.name}`} variant="ghost"><Link href={`${basePath}/products/${product.id}/edit`}><PencilSimple /></Link></IconButton></TableCell></TableRow>)}
        </TableBody></Table></div>}
        {pagination && <ListPagination {...pagination} disabled={fetching} onPageChange={props.onPageChange} />}
      </Card>
      <aside className="grid min-w-0 content-start gap-5" aria-label="Contexto do produto">
        {selected && <Card id="inventory-product-details" className="grid gap-4 p-5"><div><h2 className="text-base font-medium">Produto selecionado</h2><p className="mt-1 text-xs text-muted-foreground">{selected.sku}</p></div><ProductPreview src={selected.images[0]?.publicUrl} name={selected.name} className="mx-auto max-w-48" /><h3 className="font-medium">{name(selected)}</h3><StockBadge product={selected} /><p className="text-sm text-muted-foreground">{selected.description || "Sem descrição cadastrada."}</p><dl className="grid gap-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Custo</dt><dd className="font-medium tabular-nums">{money(selected.costPrice)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Venda</dt><dd className="font-medium tabular-nums">{money(selected.salePrice)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Disponível</dt><dd>{selected.inventoryControl === "untracked" ? "Não controlado" : `${selected.currentStock} un.`}</dd></div></dl><Button asChild variant="outline"><Link href={`${basePath}/products/${selected.id}/edit`}>Editar produto</Link></Button></Card>}
        {lowStock.length > 0 && <Card className="grid gap-4 p-5"><div><h2 className="text-base font-medium">Reposição nesta página</h2><p className="mt-1 text-xs text-muted-foreground">Produtos abaixo do mínimo cadastrado.</p></div>{lowStock.map(product => <div key={product.id} className="grid gap-3 rounded-2xl bg-background p-3"><div className="flex items-center gap-3"><ProductPreview src={product.images[0]?.publicUrl} name={product.name} className="size-12 shrink-0" /><div className="min-w-0"><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.currentStock} un. · mínimo {product.minimumStock}</p></div></div><Button asChild size="sm" variant="outline"><Link href={`${basePath}/products/${product.id}/edit`}>Revisar estoque</Link></Button></div>)}</Card>}
      </aside>
    </div>
  </DashboardShell>;
}
