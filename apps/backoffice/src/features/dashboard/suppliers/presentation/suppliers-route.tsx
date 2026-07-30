"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  PencilSimple,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@thalya-modas/ui";
import { useLocale } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";

import { normalizeLocale } from "@/src/shared/i18n/locales";

import { useSuppliersFilters } from "../../shared/application/dashboard-filters";
import {
  getSupplier,
  getSupplierOperationalSummary,
  listPurchaseOrders,
  listReceivings,
  listSuppliers,
  type PurchaseOrder,
  type Receiving,
  type Supplier,
  type SupplierOperationalSummary,
  updateSupplierStatus,
} from "../application/suppliers-api";
import {
  BoxIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { suppliersContentByLocale } from "../domain/suppliers-content";

const toneStyles: Record<string, string> = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const metricIcons = [BoxIcon, CheckIcon, ClockIcon, ChartIcon];

type Locale = "en" | "es" | "pt-BR";

function useSuppliersBasePath() {
  const params = useParams<{ role?: string }>();
  const role = params.role ?? "manager";

  return `/${role}/dashboard/suppliers`;
}

function useSuppliersWorkspace() {
  const locale = normalizeLocale(useLocale());
  const filters = useSuppliersFilters();
  const [selectedId, setSelectedId] = useQueryState("supplier", parseAsString);
  const listQuery = {
    page: filters.page,
    perPage: filters.perPage,
    q: filters.q,
    status: filters.status,
  };
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "list", listQuery],
    queryFn: () => listSuppliers(listQuery),
  });
  const suppliers = suppliersQuery.data ?? [];
  const nextPageQuery = useQuery({
    enabled:
      suppliersQuery.isSuccess && suppliers.length === filters.perPage,
    queryKey: [
      "suppliers",
      "next-page",
      filters.page,
      filters.perPage,
      filters.q,
      filters.status,
    ],
    queryFn: () =>
      listSuppliers({
        page: filters.page + 1,
        perPage: 1,
        q: filters.q,
        status: filters.status,
      }),
  });
  const summaryQuery = useQuery({
    queryKey: ["suppliers", "operational-summary"],
    queryFn: getSupplierOperationalSummary,
  });
  const selectedSupplierQuery = useQuery({
    enabled: Boolean(selectedId),
    queryKey: ["suppliers", "detail", selectedId],
    queryFn: () => getSupplier(selectedId as string),
  });
  const selectedSupplier =
    selectedSupplierQuery.data ??
    suppliers.find((supplier) => supplier.id === selectedId) ??
    suppliers[0];
  const ordersQuery = useQuery({
    enabled: Boolean(selectedSupplier?.id),
    queryKey: ["purchase-orders", "supplier", selectedSupplier?.id],
    queryFn: () =>
      listPurchaseOrders({
        page: 1,
        perPage: 100,
        supplierId: selectedSupplier?.id,
      }),
  });
  const receivingsQuery = useQuery({
    enabled: Boolean(selectedSupplier?.id),
    queryKey: ["receivings", "supplier", selectedSupplier?.id],
    queryFn: () =>
      listReceivings({
        page: 1,
        perPage: 100,
        supplierId: selectedSupplier?.id,
      }),
  });
  const orders = ordersQuery.data ?? [];
  const receivings = receivingsQuery.data ?? [];

  return {
    filters,
    hasNextPage: Boolean(nextPageQuery.data?.length),
    isInitialLoading: suppliersQuery.isPending,
    isOperationalLoading:
      selectedSupplierQuery.isPending ||
      ordersQuery.isPending ||
      receivingsQuery.isPending,
    isSummaryLoading: summaryQuery.isPending,
    locale,
    operationalError:
      summaryQuery.error ??
      selectedSupplierQuery.error ??
      ordersQuery.error ??
      receivingsQuery.error,
    orders,
    receivings,
    refetch: suppliersQuery.refetch,
    selectedId,
    selectedSupplier,
    setSelectedId,
    summary: summaryQuery.data,
    suppliers,
    suppliersError: suppliersQuery.error,
  };
}

function SuppliersHeader({
  locale,
  search,
  setSearch,
}: {
  locale: Locale;
  search: string;
  setSearch: (value: string | null) => unknown;
}) {
  const { header } = suppliersContentByLocale[locale];
  const basePath = useSuppliersBasePath();

  return (
    <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
          {header.title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {header.description}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,300px)_auto_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={header.searchPlaceholder}
            className="h-11 bg-card pl-10"
            onChange={(event) => void setSearch(event.target.value || null)}
            placeholder={header.searchPlaceholder}
            value={search}
          />
        </div>
        <Button asChild className="h-11 justify-center px-4" variant="outline">
          <Link href={`${basePath}/purchase-orders/create`}>
            <PlusIcon className="size-4" />
            {getText(locale, "newOrder")}
          </Link>
        </Button>
        <Button asChild className="h-11 justify-center px-4">
          <Link href={`${basePath}/create`}>
            <PlusIcon className="size-4" />
            {header.actionLabel}
          </Link>
        </Button>
      </div>
    </header>
  );
}

function SupplierMetrics({
  isLoading,
  locale,
  summary,
}: {
  isLoading: boolean;
  locale: Locale;
  summary?: SupplierOperationalSummary;
}) {
  const delayed =
    (summary?.delayedOrders ?? 0) + (summary?.delayedReceivings ?? 0);
  const metrics = [
    [
      getText(locale, "totalSuppliers"),
      String(summary?.totalSuppliers ?? 0),
      `${summary?.activeSuppliers ?? 0} ${getText(locale, "active").toLowerCase()}`,
      "info",
    ],
    [
      getText(locale, "withResponsible"),
      String(summary?.suppliersWithResponsible ?? 0),
      getText(locale, "contactCoverage"),
      "success",
    ],
    [
      getText(locale, "openOrders"),
      String(summary?.openOrders ?? 0),
      formatMoney(locale, summary?.openOrderValue ?? 0),
      "muted",
    ],
    [
      getText(locale, "delayedFlows"),
      String(delayed),
      getText(locale, "needsAttention"),
      delayed > 0 ? "warning" : "success",
    ],
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value, description, tone], index) => {
        const Icon = metricIcons[index] ?? ChartIcon;

        return (
          <Card key={label} className="animate-nitro-scale-in">
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <p className="flex-1 text-sm text-muted-foreground">{label}</p>
                <div
                  className={cn(
                    "flex size-8 items-center justify-center",
                    toneStyles[tone],
                  )}
                >
                  <Icon className="size-4" />
                </div>
              </div>
              {isLoading ? (
                <>
                  <div className="h-7 w-16 animate-pulse bg-muted" />
                  <div className="h-3 w-28 animate-pulse bg-muted" />
                </>
              ) : (
                <>
                  <strong className="text-[26px] font-semibold leading-none text-foreground">
                    {value}
                  </strong>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function SupplierFilterBar({
  locale,
  setStatus,
  status,
}: {
  locale: Locale;
  setStatus: (value: string | null) => unknown;
  status: string;
}) {
  const filters = [
    ["all", getText(locale, "allSuppliers")],
    ["active", getText(locale, "active")],
    ["inactive", getText(locale, "inactive")],
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map(([value, label]) => {
        const active = status === value;

        return (
          <Button
            key={value}
            aria-pressed={active}
            className={cn("h-9 shrink-0 px-3", active && "bg-secondary")}
            onClick={() => void setStatus(value === "all" ? null : value)}
            variant={active ? "secondary" : "outline"}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function SupplierTableCard({
  hasNextPage,
  isLoading,
  locale,
  onClearFilters,
  onExport,
  onSelect,
  onToggle,
  onToggleAll,
  page,
  q,
  refetch,
  selectedId,
  selectedRows,
  setPage,
  status,
  suppliers,
  suppliersError,
}: {
  hasNextPage: boolean;
  isLoading: boolean;
  locale: Locale;
  onClearFilters: () => void;
  onExport: (suppliers: Supplier[]) => void;
  onSelect: (supplierId: string) => void;
  onToggle: (supplierId: string) => void;
  onToggleAll: () => void;
  page: number;
  q: string;
  refetch: () => unknown;
  selectedId?: string | null;
  selectedRows: Set<string>;
  setPage: (page: number) => unknown;
  status: string;
  suppliers: Supplier[];
  suppliersError: Error | null;
}) {
  const basePath = useSuppliersBasePath();
  const hasFilters = Boolean(q || (status && status !== "all") || page > 1);
  const allSelected =
    suppliers.length > 0 && suppliers.every((supplier) => selectedRows.has(supplier.id));

  return (
    <Card className="min-h-[520px]">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">
              {getText(locale, "tableTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getText(locale, "tableDescription")}
            </p>
          </div>
          <Button
            className="h-9 px-3"
            disabled={suppliers.length === 0}
            onClick={() => onExport(suppliers)}
            variant="outline"
          >
            <DownloadSimple className="size-4" />
            {getText(locale, "export")}
          </Button>
        </div>

        {isLoading ? (
          <SupplierTableLoading />
        ) : suppliersError ? (
          <StatePanel
            actionLabel={getText(locale, "tryAgain")}
            description={getText(locale, "loadErrorDescription")}
            onAction={() => void refetch()}
            title={getText(locale, "loadError")}
          />
        ) : suppliers.length === 0 ? (
          <StatePanel
            actionHref={hasFilters ? undefined : `${basePath}/create`}
            actionLabel={
              hasFilters ? getText(locale, "clearFilters") : getText(locale, "newSupplier")
            }
            description={
              hasFilters
                ? getText(locale, "noResultsDescription")
                : getText(locale, "emptyDescription")
            }
            onAction={hasFilters ? onClearFilters : undefined}
            title={
              hasFilters ? getText(locale, "noResults") : getText(locale, "emptyTitle")
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label={getText(locale, "selectAll")}
                        checked={allSelected}
                        onCheckedChange={onToggleAll}
                      />
                    </TableHead>
                    <TableHead>{getText(locale, "supplier")}</TableHead>
                    <TableHead>{getText(locale, "contact")}</TableHead>
                    <TableHead>{getText(locale, "category")}</TableHead>
                    <TableHead>{getText(locale, "terms")}</TableHead>
                    <TableHead>{getText(locale, "status")}</TableHead>
                    <TableHead className="text-right">{getText(locale, "actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => {
                    const primary =
                      supplier.responsibles.find((responsible) => responsible.isPrimary) ??
                      supplier.responsibles[0];
                    const isSelected = selectedId
                      ? selectedId === supplier.id
                      : supplier.id === suppliers[0]?.id;

                    return (
                      <TableRow
                        key={supplier.id}
                        className={cn(isSelected && "bg-muted/60")}
                      >
                        <TableCell>
                          <Checkbox
                            aria-label={`${getText(locale, "select")} ${supplier.name}`}
                            checked={selectedRows.has(supplier.id)}
                            onCheckedChange={() => onToggle(supplier.id)}
                          />
                        </TableCell>
                        <TableCell className="min-w-[210px]">
                          <button
                            className="grid cursor-pointer gap-0.5 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => onSelect(supplier.id)}
                            type="button"
                          >
                            <strong className="font-semibold text-foreground">
                              {supplier.name}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              {formatDocument(supplier.document) || getText(locale, "noDocument")}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="min-w-[190px]">
                          <p className="text-sm text-foreground">
                            {primary?.name ?? getText(locale, "noResponsible")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {primary?.email ?? supplier.email ?? "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getCategoryLabel(locale, supplier.category)}
                        </TableCell>
                        <TableCell className="min-w-[140px] text-muted-foreground">
                          {getTermLabel(locale, supplier.deliveryTerm)} /{" "}
                          {getTermLabel(locale, supplier.paymentTerm)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={supplier.status === "active" ? "success" : "outline"}>
                            {getStatusLabel(locale, supplier.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              asChild
                              aria-label={`${getText(locale, "edit")} ${supplier.name}`}
                              className="size-8 p-0"
                              variant="ghost"
                            >
                              <Link href={`${basePath}/${supplier.id}/edit`}>
                                <PencilSimple className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              aria-label={`${getText(locale, "responsibles")} ${supplier.name}`}
                              className="size-8 p-0"
                              variant="ghost"
                            >
                              <Link href={`${basePath}/${supplier.id}/responsible`}>
                                <UserPlus className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              aria-label={`${getText(locale, "delete")} ${supplier.name}`}
                              className="size-8 p-0 text-destructive hover:text-destructive"
                              variant="ghost"
                            >
                              <Link href={`${basePath}/${supplier.id}/delete`}>
                                <Trash className="size-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {getPageText(locale, page, suppliers.length)}
              </p>
              <div className="flex gap-2">
                <Button
                  aria-label={getText(locale, "previousPage")}
                  className="h-9 px-3"
                  disabled={page <= 1}
                  onClick={() => void setPage(Math.max(1, page - 1))}
                  variant="outline"
                >
                  <CaretLeft className="size-4" />
                  {getText(locale, "previous")}
                </Button>
                <Button
                  aria-label={getText(locale, "nextPage")}
                  className="h-9 px-3"
                  disabled={!hasNextPage}
                  onClick={() => void setPage(page + 1)}
                  variant="outline"
                >
                  {getText(locale, "next")}
                  <CaretRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SupplierTableLoading() {
  return (
    <div aria-label="Carregando fornecedores" className="grid gap-2" role="status">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse border border-border bg-muted/60"
        />
      ))}
    </div>
  );
}

function StatePanel({
  actionHref,
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionHref?: string;
  actionLabel: string;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  const action = (
    <>
      {onAction ? <ArrowClockwise className="size-4" /> : <PlusIcon className="size-4" />}
      {actionLabel}
    </>
  );

  return (
    <div className="grid min-h-[320px] place-items-center border border-dashed border-border bg-muted/40 p-6 text-center">
      <div className="grid max-w-[380px] justify-items-center gap-3">
        <div className="flex size-11 items-center justify-center bg-primary text-primary-foreground">
          <BoxIcon className="size-5" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionHref ? (
          <Button asChild className="h-10 px-4">
            <Link href={actionHref}>{action}</Link>
          </Button>
        ) : (
          <Button className="h-10 px-4" onClick={onAction}>
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}

function SupplierBulkActions({
  isPending,
  locale,
  onChangeStatus,
  onClear,
  onExport,
  selectedSuppliers,
}: {
  isPending: boolean;
  locale: Locale;
  onChangeStatus: (status: "active" | "inactive") => void;
  onClear: () => void;
  onExport: () => void;
  selectedSuppliers: Supplier[];
}) {
  if (selectedSuppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <BoxIcon className="size-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {getText(locale, "bulkHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <strong className="text-sm text-foreground">
          {selectedSuppliers.length} {getText(locale, "selected").toLowerCase()}
        </strong>
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
          <Button
            className="h-9 px-3"
            disabled={isPending}
            onClick={() => onChangeStatus("active")}
            variant="outline"
          >
            {getText(locale, "activate")}
          </Button>
          <Button
            className="h-9 px-3"
            disabled={isPending}
            onClick={() => onChangeStatus("inactive")}
            variant="outline"
          >
            {getText(locale, "deactivate")}
          </Button>
          <Button className="h-9 px-3" onClick={onExport} variant="outline">
            <DownloadSimple className="size-4" />
            {getText(locale, "export")}
          </Button>
          <Button className="h-9 px-3" onClick={onClear} variant="ghost">
            {getText(locale, "clearSelection")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierDetailRail({
  isLoading,
  locale,
  orders,
  receivings,
  supplier,
}: {
  isLoading: boolean;
  locale: Locale;
  orders: PurchaseOrder[];
  receivings: Receiving[];
  supplier?: Supplier;
}) {
  const basePath = useSuppliersBasePath();

  if (!supplier) {
    return (
      <aside className="grid min-w-0 content-start gap-3 xl:w-[340px]">
        <Card>
          <CardContent className="grid gap-2 p-5 text-center">
            <BoxIcon className="mx-auto size-6 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              {getText(locale, "noSelection")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getText(locale, "noSelectionDescription")}
            </p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  const supplierOrders = orders.filter((order) => order.supplierId === supplier.id);
  const supplierReceivings = receivings.filter(
    (receiving) => receiving.supplierId === supplier.id,
  );
  const nextReceiving = supplierReceivings.find((receiving) =>
    ["scheduled", "checking", "delayed"].includes(receiving.status),
  );
  const openOrders = supplierOrders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  );
  const primary =
    supplier.responsibles.find((responsible) => responsible.isPrimary) ??
    supplier.responsibles[0];

  return (
    <aside className="grid min-w-0 content-start gap-3 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
              {getInitials(supplier.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold leading-6">{supplier.name}</h2>
              <p className="truncate text-xs leading-5 text-white/80">
                {getCategoryLabel(locale, supplier.category)} ·{" "}
                {getStatusLabel(locale, supplier.status)}
              </p>
            </div>
          </div>
          <DetailRow
            label={getText(locale, "responsible")}
            value={primary?.name ?? getText(locale, "notRegistered")}
          />
          <DetailRow
            label={getText(locale, "openOrders")}
            value={String(openOrders.length)}
          />
          <DetailRow
            label={getText(locale, "openValue")}
            value={formatMoney(
              locale,
              openOrders.reduce((total, order) => total + order.totalCost, 0),
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">
            {getText(locale, "commercialTerms")}
          </h2>
          <PlainDetailRow
            label={getText(locale, "delivery")}
            value={getTermLabel(locale, supplier.deliveryTerm)}
          />
          <PlainDetailRow
            label={getText(locale, "payment")}
            value={getTermLabel(locale, supplier.paymentTerm)}
          />
          <PlainDetailRow
            label={getText(locale, "minimumOrder")}
            value={supplier.minimumOrder || "-"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">
            {getText(locale, "nextReceiving")}
          </h2>
          {isLoading ? (
            <div className="h-16 animate-pulse bg-muted" />
          ) : nextReceiving ? (
            <>
              <PlainDetailRow
                label={getText(locale, "forecast")}
                value={formatDate(locale, nextReceiving.expectedAt)}
              />
              <PlainDetailRow
                label={getText(locale, "invoice")}
                value={nextReceiving.invoiceNumber || "-"}
              />
              <PlainDetailRow
                label={getText(locale, "volumes")}
                value={String(nextReceiving.volumes)}
              />
            </>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              {getText(locale, "noReceiving")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-4">
          <Button asChild className="h-9 justify-start" variant="outline">
            <Link href={`${basePath}/${supplier.id}/edit`}>
              <PencilSimple className="size-4" />
              {getText(locale, "editSupplier")}
            </Link>
          </Button>
          <Button asChild className="h-9 justify-start" variant="outline">
            <Link href={`${basePath}/${supplier.id}/responsible`}>
              <UserPlus className="size-4" />
              {getText(locale, "manageResponsibles")}
            </Link>
          </Button>
          {supplier.status === "active" ? (
            <Button asChild className="h-9 justify-start" variant="outline">
              <Link href={`${basePath}/purchase-orders/create?supplierId=${supplier.id}`}>
                <PlusIcon className="size-4" />
                {getText(locale, "newOrder")}
              </Link>
            </Button>
          ) : (
            <Button
              className="h-9 justify-start"
              disabled
              title={getText(locale, "inactiveOrderHint")}
              variant="outline"
            >
              <PlusIcon className="size-4" />
              {getText(locale, "newOrder")}
            </Button>
          )}
          <Button
            asChild
            className="h-9 justify-start text-destructive hover:text-destructive"
            variant="ghost"
          >
            <Link href={`${basePath}/${supplier.id}/delete`}>
              <Trash className="size-4" />
              {getText(locale, "deleteSupplier")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-white/80">{label}</span>
      <strong className="truncate text-xs font-semibold">{value}</strong>
    </div>
  );
}

function PlainDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="truncate text-xs font-semibold text-foreground">{value}</strong>
    </div>
  );
}

function NoticeBanner({ locale, notice }: { locale: Locale; notice?: string | null }) {
  if (!notice) return null;
  const message = getNotice(locale, notice);
  if (!message) return null;

  return (
    <div
      className="flex items-center gap-2 border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
      role="status"
    >
      <CheckIcon className="size-4 text-success" />
      {message}
    </div>
  );
}

export function SuppliersRoute() {
  const queryClient = useQueryClient();
  const workspace = useSuppliersWorkspace();
  const [notice] = useQueryState("notice", parseAsString);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const selectedSuppliers = useMemo(
    () => workspace.suppliers.filter((supplier) => selectedRows.has(supplier.id)),
    [selectedRows, workspace.suppliers],
  );
  const statusMutation = useMutation({
    mutationFn: async (status: "active" | "inactive") => {
      await Promise.all(
        selectedSuppliers.map((supplier) => updateSupplierStatus(supplier.id, status)),
      );
    },
    onError: () => setBulkError(getText(workspace.locale, "bulkError")),
    onSuccess: () => {
      setBulkError(null);
      setSelectedRows(new Set());
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
  const dueReceivings = workspace.summary?.dueReceivings ?? 0;
  const content = suppliersContentByLocale[workspace.locale];

  function toggleRow(supplierId: string) {
    setSelectedRows((current) => {
      const next = new Set(current);
      if (next.has(supplierId)) next.delete(supplierId);
      else next.add(supplierId);
      return next;
    });
  }

  function toggleAll() {
    setSelectedRows((current) => {
      const allSelected =
        workspace.suppliers.length > 0 &&
        workspace.suppliers.every((supplier) => current.has(supplier.id));
      if (allSelected) {
        const next = new Set(current);
        workspace.suppliers.forEach((supplier) => next.delete(supplier.id));
        return next;
      }

      return new Set([
        ...current,
        ...workspace.suppliers.map((supplier) => supplier.id),
      ]);
    });
  }

  function clearFilters() {
    void workspace.filters.setQ(null);
    void workspace.filters.setStatus(null);
    void workspace.filters.setPage(1);
  }

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={content.sidebar.operatorRole}
      status={getSidebarStatus(workspace.locale, dueReceivings)}
    >
      <SuppliersHeader
        locale={workspace.locale}
        search={workspace.filters.q}
        setSearch={workspace.filters.setQ}
      />
      <NoticeBanner locale={workspace.locale} notice={notice} />
      {bulkError ? (
        <div
          className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {bulkError}
        </div>
      ) : null}
      {workspace.operationalError ? (
        <div
          className="border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"
          role="alert"
        >
          {getText(workspace.locale, "operationalError")}
        </div>
      ) : null}
      <SupplierMetrics
        isLoading={workspace.isSummaryLoading}
        locale={workspace.locale}
        summary={workspace.summary}
      />
      <SupplierFilterBar
        locale={workspace.locale}
        setStatus={workspace.filters.setStatus}
        status={workspace.filters.status}
      />
      <div className="grid min-h-0 min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
        <div className="grid min-w-0 gap-4">
          <SupplierTableCard
            hasNextPage={workspace.hasNextPage}
            isLoading={workspace.isInitialLoading}
            locale={workspace.locale}
            onClearFilters={clearFilters}
            onExport={downloadSuppliersCsv}
            onSelect={(supplierId) => void workspace.setSelectedId(supplierId)}
            onToggle={toggleRow}
            onToggleAll={toggleAll}
            page={workspace.filters.page}
            q={workspace.filters.q}
            refetch={workspace.refetch}
            selectedId={workspace.selectedId}
            selectedRows={selectedRows}
            setPage={workspace.filters.setPage}
            status={workspace.filters.status}
            suppliers={workspace.suppliers}
            suppliersError={workspace.suppliersError}
          />
          <SupplierBulkActions
            isPending={statusMutation.isPending}
            locale={workspace.locale}
            onChangeStatus={(status) => statusMutation.mutate(status)}
            onClear={() => setSelectedRows(new Set())}
            onExport={() => downloadSuppliersCsv(selectedSuppliers)}
            selectedSuppliers={selectedSuppliers}
          />
        </div>
        <SupplierDetailRail
          isLoading={workspace.isOperationalLoading}
          locale={workspace.locale}
          orders={workspace.orders}
          receivings={workspace.receivings}
          supplier={workspace.selectedSupplier}
        />
      </div>
    </DashboardShell>
  );
}

function downloadSuppliersCsv(suppliers: Supplier[]) {
  const rows = [
    ["Nome", "Documento", "E-mail", "Telefone", "Categoria", "Status"],
    ...suppliers.map((supplier) => [
      supplier.name,
      supplier.document ?? "",
      supplier.email ?? "",
      supplier.phone ?? "",
      supplier.category ?? "",
      supplier.status,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "fornecedores.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatMoney(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale, {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDocument(value?: string) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusLabel(locale: Locale, status: Supplier["status"]) {
  return status === "active"
    ? getText(locale, "active")
    : getText(locale, "inactive");
}

function getTermLabel(locale: Locale, term?: string) {
  if (!term) return "-";
  return `${term} ${locale === "en" ? "days" : "dias"}`;
}

function getCategoryLabel(locale: Locale, category?: Supplier["category"]) {
  if (!category) return getText(locale, "notRegistered");
  const labels = {
    accessories: ["Acessórios", "Accessories", "Accesorios"],
    footwear: ["Calçados", "Footwear", "Calzado"],
    mens_fashion: ["Moda masculina", "Menswear", "Moda masculina"],
    packaging: ["Embalagens", "Packaging", "Embalajes"],
    women_fashion: ["Moda feminina", "Womenswear", "Moda femenina"],
  } as const;
  const index = locale === "en" ? 1 : locale === "es" ? 2 : 0;
  return labels[category][index];
}

function getPageText(locale: Locale, page: number, count: number) {
  if (locale === "en") return `Page ${page} · ${count} suppliers`;
  if (locale === "es") return `Página ${page} · ${count} proveedores`;
  return `Página ${page} · ${count} fornecedores`;
}

function getSidebarStatus(locale: Locale, due: number) {
  if (locale === "en") return `${due} deliveries need attention`;
  if (locale === "es") return `${due} entregas requieren atención`;
  return `${due} entregas precisam de atenção`;
}

function getNotice(locale: Locale, notice: string) {
  const notices: Record<string, [string, string, string]> = {
    created: [
      "Fornecedor cadastrado com sucesso.",
      "Supplier created successfully.",
      "Proveedor creado correctamente.",
    ],
    createdPartial: [
      "Fornecedor cadastrado, mas alguns responsáveis não puderam ser salvos.",
      "Supplier created, but some contacts could not be saved.",
      "Proveedor creado, pero algunos responsables no pudieron guardarse.",
    ],
    deleted: [
      "Fornecedor excluído com sucesso.",
      "Supplier deleted successfully.",
      "Proveedor eliminado correctamente.",
    ],
    orderCreated: [
      "Pedido de compra criado com sucesso.",
      "Purchase order created successfully.",
      "Orden de compra creada correctamente.",
    ],
    responsibleSaved: [
      "Responsáveis atualizados com sucesso.",
      "Responsible contacts updated successfully.",
      "Responsables actualizados correctamente.",
    ],
    updated: [
      "Fornecedor atualizado com sucesso.",
      "Supplier updated successfully.",
      "Proveedor actualizado correctamente.",
    ],
  };
  const index = locale === "en" ? 1 : locale === "es" ? 2 : 0;
  return notices[notice]?.[index];
}

function getText(locale: Locale, key: string) {
  const copy: Record<string, [string, string, string]> = {
    actions: ["Ações", "Actions", "Acciones"],
    activate: ["Ativar", "Activate", "Activar"],
    active: ["Ativos", "Active", "Activos"],
    allSuppliers: ["Todos fornecedores", "All suppliers", "Todos los proveedores"],
    bulkError: [
      "Não foi possível atualizar os fornecedores selecionados.",
      "Could not update the selected suppliers.",
      "No se pudieron actualizar los proveedores seleccionados.",
    ],
    bulkHint: [
      "Selecione fornecedores para ativar, inativar ou exportar os registros.",
      "Select suppliers to activate, deactivate, or export records.",
      "Selecciona proveedores para activar, desactivar o exportar registros.",
    ],
    category: ["Categoria", "Category", "Categoría"],
    clearFilters: ["Limpar filtros", "Clear filters", "Limpiar filtros"],
    clearSelection: ["Limpar seleção", "Clear selection", "Limpiar selección"],
    commercialTerms: ["Condições comerciais", "Commercial terms", "Condiciones comerciales"],
    contact: ["Contato principal", "Primary contact", "Contacto principal"],
    contactCoverage: ["Cobertura de contatos", "Contact coverage", "Cobertura de contactos"],
    deactivate: ["Inativar", "Deactivate", "Desactivar"],
    delayedFlows: ["Fluxos atrasados", "Delayed flows", "Flujos atrasados"],
    delete: ["Excluir", "Delete", "Eliminar"],
    deleteSupplier: ["Excluir fornecedor", "Delete supplier", "Eliminar proveedor"],
    delivery: ["Entrega", "Delivery", "Entrega"],
    edit: ["Editar", "Edit", "Editar"],
    editSupplier: ["Editar fornecedor", "Edit supplier", "Editar proveedor"],
    emptyDescription: [
      "Cadastre o primeiro fornecedor para acompanhar contatos, condições e pedidos.",
      "Create the first supplier to track contacts, terms, and purchase orders.",
      "Crea el primer proveedor para seguir contactos, condiciones y órdenes.",
    ],
    emptyTitle: ["Nenhum fornecedor cadastrado", "No suppliers yet", "Aún no hay proveedores"],
    export: ["Exportar CSV", "Export CSV", "Exportar CSV"],
    forecast: ["Previsão", "Forecast", "Previsión"],
    inactive: ["Inativos", "Inactive", "Inactivos"],
    inactiveOrderHint: [
      "Ative o fornecedor antes de criar um pedido.",
      "Activate the supplier before creating a purchase order.",
      "Activa el proveedor antes de crear una orden.",
    ],
    invoice: ["Nota fiscal", "Invoice", "Factura"],
    loadError: ["Não foi possível carregar", "Could not load suppliers", "No se pudo cargar"],
    loadErrorDescription: [
      "Verifique a conexão e tente novamente.",
      "Check your connection and try again.",
      "Comprueba la conexión e inténtalo de nuevo.",
    ],
    manageResponsibles: ["Gerenciar responsáveis", "Manage contacts", "Gestionar responsables"],
    minimumOrder: ["Pedido mínimo", "Minimum order", "Pedido mínimo"],
    needsAttention: ["Requer acompanhamento", "Needs attention", "Requiere seguimiento"],
    newOrder: ["Novo pedido", "New PO", "Nueva orden"],
    newSupplier: ["Novo fornecedor", "New supplier", "Nuevo proveedor"],
    next: ["Próxima", "Next", "Siguiente"],
    nextPage: ["Próxima página", "Next page", "Página siguiente"],
    nextReceiving: ["Próximo recebimento", "Next receiving", "Próxima recepción"],
    noDocument: ["Documento não informado", "No document", "Documento no informado"],
    noReceiving: [
      "Nenhum recebimento pendente para este fornecedor.",
      "No pending receiving for this supplier.",
      "No hay recepciones pendientes para este proveedor.",
    ],
    noResponsible: ["Sem responsável", "No contact", "Sin responsable"],
    noResults: ["Nenhum resultado encontrado", "No results found", "No se encontraron resultados"],
    noResultsDescription: [
      "Ajuste a busca ou limpe os filtros para ver outros fornecedores.",
      "Adjust the search or clear filters to see other suppliers.",
      "Ajusta la búsqueda o limpia los filtros para ver otros proveedores.",
    ],
    noSelection: ["Nenhum fornecedor selecionado", "No supplier selected", "Ningún proveedor seleccionado"],
    noSelectionDescription: [
      "Selecione um fornecedor na lista para ver detalhes e ações.",
      "Select a supplier in the list to see details and actions.",
      "Selecciona un proveedor para ver detalles y acciones.",
    ],
    notRegistered: ["Não informado", "Not provided", "No informado"],
    openOrders: ["Pedidos abertos", "Open POs", "Órdenes abiertas"],
    openValue: ["Valor aberto", "Open value", "Valor abierto"],
    operationalError: [
      "Alguns indicadores operacionais não puderam ser atualizados.",
      "Some operational indicators could not be refreshed.",
      "Algunos indicadores operativos no pudieron actualizarse.",
    ],
    payment: ["Pagamento", "Payment", "Pago"],
    previous: ["Anterior", "Previous", "Anterior"],
    previousPage: ["Página anterior", "Previous page", "Página anterior"],
    responsible: ["Responsável", "Contact", "Responsable"],
    responsibles: ["Responsáveis", "Contacts", "Responsables"],
    select: ["Selecionar", "Select", "Seleccionar"],
    selectAll: ["Selecionar todos", "Select all", "Seleccionar todos"],
    selected: ["Selecionados", "Selected", "Seleccionados"],
    status: ["Status", "Status", "Estado"],
    supplier: ["Fornecedor", "Supplier", "Proveedor"],
    tableDescription: [
      "Cadastros, contatos e condições comerciais dos fornecedores da loja.",
      "Supplier records, contacts, and commercial terms.",
      "Registros, contactos y condiciones comerciales de proveedores.",
    ],
    tableTitle: ["Fornecedores cadastrados", "Registered suppliers", "Proveedores registrados"],
    terms: ["Prazos", "Terms", "Plazos"],
    totalSuppliers: ["Fornecedores", "Suppliers", "Proveedores"],
    tryAgain: ["Tentar novamente", "Try again", "Intentar de nuevo"],
    volumes: ["Volumes", "Volumes", "Volúmenes"],
    withResponsible: ["Com responsável", "With contact", "Con responsable"],
  };
  const index = locale === "en" ? 1 : locale === "es" ? 2 : 0;
  return copy[key]?.[index] ?? key;
}
