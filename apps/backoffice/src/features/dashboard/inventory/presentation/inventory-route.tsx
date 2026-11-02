"use client";
import { useRemotePage } from "@/src/features/backoffice/presentation/list-pagination";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Barcode, DotsThreeVertical, Package, WarningCircle } from "@phosphor-icons/react";
import { InventoryWorkspace } from "./inventory-workspace";

import { listAllSuppliers } from "../../suppliers/application/suppliers-api";
import { useInventoryFilters } from "../../shared/application/dashboard-filters";
import {
  findProductByBarcode,
  useProductsPageQuery,
} from "../application/products-api";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";

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
  const [view, setView] = useState<"table" | "catalog">("table");
  const pagination=useRemotePage(`${q}|${status}`);
  const productsQuery = useProductsPageQuery({ q,status,page:pagination.page,perPage:20 });
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "product-options"],
    queryFn: () => listAllSuppliers(),
    staleTime: 60_000,
  });
  const supplierNames = useMemo(
    () => new Map((suppliersQuery.data ?? []).map((supplier) => [supplier.id, supplier.name])),
    [suppliersQuery.data],
  );
  const products = productsQuery.data?.items ?? [];
  const filteredProducts = products.filter((product) => {
    if (status === "tracked") return product.inventoryControl === "tracked" && product.status === "active";
    if (status === "untracked") return product.inventoryControl === "untracked" && product.status === "active";
    if (status === "low") return product.inventoryControl === "tracked" && product.status === "active" && product.currentStock <= product.minimumStock;
    if (status === "inactive") return product.status === "inactive";
    return true;
  });
  const selected = filteredProducts.find((product) => product.id === selectedId) ?? filteredProducts[0];
  const activeProducts = products.filter((product) => product.status === "active");
  const trackedProducts = activeProducts.filter((product) => product.inventoryControl === "tracked");
  const metrics = [
    { description: `${activeProducts.length} ativos nesta página`, icon: Package, label: "Produtos encontrados", value: (productsQuery.data?.total ?? 0).toString() },
    { description: "Itens controlados nesta página", icon: Barcode, label: "Unidades em estoque", value: trackedProducts.reduce((sum, product) => sum + product.currentStock, 0).toString() },
    { description: "Nesta página", icon: WarningCircle, label: "Abaixo do mínimo", value: trackedProducts.filter((product) => product.currentStock <= product.minimumStock).length.toString() },
    { description: "Sem controle de saldo nesta página", icon: DotsThreeVertical, label: "Produtos avulsos", value: activeProducts.filter((product) => product.inventoryControl === "untracked").length.toString() },
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

  return <>
    <InventoryWorkspace basePath={basePath} products={filteredProducts} selected={selected} supplierNames={supplierNames} metrics={metrics} pagination={productsQuery.data}
      q={q} status={status} view={view} loading={productsQuery.isLoading} fetching={productsQuery.isFetching} failed={productsQuery.isError} scanError={scanError}
      onSearch={value => void setQ(value || null)} onFilter={value => void setStatus(value === "all" ? null : value)} onViewChange={setView}
      onSelect={id => void setSelectedId(id)} onPageChange={pagination.onPageChange} onScan={() => setScannerOpen(true)} onRetry={() => void productsQuery.refetch()} />
    <BarcodeScannerDialog onCode={code => void handleScannedCode(code)} onOpenChange={setScannerOpen} open={scannerOpen} />
  </>;
}
