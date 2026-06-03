"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
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

import { normalizeLocale } from "@/src/shared/i18n/locales";

import { useDashboardSuppliersQuery } from "../../shared/application/dashboard-api";
import { useSuppliersFilters } from "../../shared/application/dashboard-filters";
import { listSuppliers } from "../application/suppliers-api";
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

function useSuppliersContent() {
  const locale = normalizeLocale(useLocale());
  const fallback = suppliersContentByLocale[locale];
  const { query } = useSuppliersFilters();
  const { data: dashboardData } = useDashboardSuppliersQuery(query);
  const { data: catalogSuppliers } = useQuery({
    queryKey: ["suppliers", query],
    queryFn: () => listSuppliers(query),
  });

  if (!dashboardData && !catalogSuppliers) {
    return {
      ...fallback,
      emptyState: getEmptyStateText(locale),
      hasSuppliers: false,
    };
  }
  const suppliers = catalogSuppliers ?? [];
  const firstSupplier = suppliers[0];
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === "active");
  const inactiveSuppliers = suppliers.filter((supplier) => supplier.status === "inactive");

  return {
    ...fallback,
    hasSuppliers: suppliers.length > 0,
    filters: getCatalogSupplierFilters(locale),
    metrics: getCatalogSupplierMetrics(locale, {
      active: activeSuppliers.length,
      inactive: inactiveSuppliers.length,
      total: suppliers.length,
      withResponsible: suppliers.filter((supplier) => supplier.responsibles.length > 0).length,
    }),
    table: {
      ...fallback.table,
      heads: getCatalogSupplierTableHeads(locale),
      rows: suppliers.map((supplier) => [
        supplier.name,
        supplier.id,
        supplier.category ? getCategoryLabel(locale, supplier.category) : "-",
        supplier.deliveryTerm ? getTermLabel(locale, supplier.deliveryTerm) : "-",
        supplier.paymentTerm ? getTermLabel(locale, supplier.paymentTerm) : "-",
        getStatusLabel(locale, supplier.status),
      ]),
    },
    selectedSupplier: {
      ...fallback.selectedSupplier,
      name: firstSupplier?.name ?? getEmptyStateText(locale).railTitle,
      description: firstSupplier
        ? getStatusLabel(locale, firstSupplier.status)
        : getEmptyStateText(locale).railDescription,
      stats: [
        [getTableLabel(locale, "deliveryTerm"), firstSupplier?.deliveryTerm ? getTermLabel(locale, firstSupplier.deliveryTerm) : "-"],
        [getTableLabel(locale, "paymentTerm"), firstSupplier?.paymentTerm ? getTermLabel(locale, firstSupplier.paymentTerm) : "-"],
      ],
    },
    deliveryPlan: {
      ...fallback.deliveryPlan,
      rows: firstSupplier
        ? [
            [
              getTableLabel(locale, "deliveryTerm"),
              firstSupplier.deliveryTerm ? getTermLabel(locale, firstSupplier.deliveryTerm) : "-",
            ],
            [
              getTableLabel(locale, "paymentTerm"),
              firstSupplier.paymentTerm ? getTermLabel(locale, firstSupplier.paymentTerm) : "-",
            ],
          ]
        : [],
    },
    emptyState: getEmptyStateText(locale),
    nextActions: firstSupplier
      ? getSupplierNextActions(locale, firstSupplier.responsibles.length)
      : [],
  };
}

function getCatalogSupplierMetrics(
  locale: string,
  counts: { active: number; inactive: number; total: number; withResponsible: number },
) {
  if (locale === "en") {
    return [
      ["Registered suppliers", String(counts.total), `${counts.active} active`, "info"],
      ["Active suppliers", String(counts.active), `${counts.inactive} inactive`, "success"],
      ["With responsible", String(counts.withResponsible), "Contacts linked", "muted"],
      ["Need setup", String(Math.max(counts.total - counts.withResponsible, 0)), "Missing responsible", "warning"],
    ] as const;
  }

  if (locale === "es") {
    return [
      ["Proveedores registrados", String(counts.total), `${counts.active} activos`, "info"],
      ["Proveedores activos", String(counts.active), `${counts.inactive} inactivos`, "success"],
      ["Con responsable", String(counts.withResponsible), "Contactos vinculados", "muted"],
      ["Pendientes", String(Math.max(counts.total - counts.withResponsible, 0)), "Sin responsable", "warning"],
    ] as const;
  }

  return [
    ["Fornecedores cadastrados", String(counts.total), `${counts.active} ativos`, "info"],
    ["Fornecedores ativos", String(counts.active), `${counts.inactive} inativos`, "success"],
    ["Com responsável", String(counts.withResponsible), "Contatos vinculados", "muted"],
    ["Pendentes", String(Math.max(counts.total - counts.withResponsible, 0)), "Sem responsável", "warning"],
  ] as const;
}

function getEmptyStateText(locale: string) {
  if (locale === "en") {
    return {
      action: "New supplier",
      description: "Create the first supplier to start tracking terms, contacts and receiving priorities.",
      railDescription: "Select or create a supplier to view commercial terms and actions.",
      railTitle: "No supplier selected",
      tableTitle: "No suppliers yet",
    };
  }

  if (locale === "es") {
    return {
      action: "Nuevo proveedor",
      description: "Crea el primer proveedor para seguir terminos, contactos y prioridades de recepcion.",
      railDescription: "Selecciona o crea un proveedor para ver terminos comerciales y acciones.",
      railTitle: "Ningun proveedor seleccionado",
      tableTitle: "Aun no hay proveedores",
    };
  }

  return {
    action: "Novo fornecedor",
    description: "Cadastre o primeiro fornecedor para acompanhar prazos, contatos e prioridades de recebimento.",
    railDescription: "Selecione ou cadastre um fornecedor para ver termos comerciais e ações.",
    railTitle: "Nenhum fornecedor selecionado",
    tableTitle: "Nenhum fornecedor cadastrado",
  };
}

function getSupplierNextActions(locale: string, responsiblesCount: number) {
  if (locale === "en") {
    return responsiblesCount > 0
      ? ["Review commercial terms", "Confirm next receiving window"]
      : ["Add a responsible contact", "Review commercial terms"];
  }

  if (locale === "es") {
    return responsiblesCount > 0
      ? ["Revisar terminos comerciales", "Confirmar proxima ventana de recepcion"]
      : ["Agregar responsable", "Revisar terminos comerciales"];
  }

  return responsiblesCount > 0
    ? ["Revisar condições comerciais", "Confirmar próxima janela de recebimento"]
    : ["Adicionar responsável", "Revisar condições comerciais"];
}

function getCatalogSupplierFilters(locale: string) {
  if (locale === "en") {
    return [
      ["all", "All suppliers"],
      ["active", "Active"],
      ["inactive", "Inactive"],
    ];
  }

  if (locale === "es") {
    return [
      ["all", "Todos proveedores"],
      ["active", "Activos"],
      ["inactive", "Inactivos"],
    ];
  }

  return [
    ["all", "Todos fornecedores"],
    ["active", "Ativos"],
    ["inactive", "Inativos"],
  ];
}

function getCatalogSupplierTableHeads(locale: string) {
  if (locale === "en") {
    return ["Supplier", "ID", "Category", "Delivery", "Payment", "Status"];
  }

  if (locale === "es") {
    return ["Proveedor", "ID", "Categoria", "Entrega", "Pago", "Estado"];
  }

  return ["Fornecedor", "ID", "Categoria", "Entrega", "Pagamento", "Status"];
}

function getCategoryLabel(locale: string, category: string) {
  const labels = {
    accessories: ["Acessorios", "Accessories", "Accesorios"],
    footwear: ["Calcados", "Footwear", "Calzado"],
    mens_fashion: ["Moda masculina", "Men's fashion", "Moda masculina"],
    packaging: ["Embalagens", "Packaging", "Embalajes"],
    women_fashion: ["Moda feminina", "Women's fashion", "Moda femenina"],
  } as const;
  const index = locale === "en" ? 1 : locale === "es" ? 2 : 0;

  return labels[category as keyof typeof labels]?.[index] ?? category;
}

function getStatusLabel(locale: string, status: string) {
  if (status === "active") return locale === "en" ? "Active" : locale === "es" ? "Activo" : "Ativo";
  if (status === "inactive") return locale === "en" ? "Inactive" : locale === "es" ? "Inactivo" : "Inativo";
  return status;
}

function getTableLabel(locale: string, key: "deliveryTerm" | "paymentTerm") {
  if (key === "deliveryTerm") {
    return locale === "en" ? "Delivery" : locale === "es" ? "Entrega" : "Entrega";
  }

  return locale === "en" ? "Payment" : locale === "es" ? "Pago" : "Pagamento";
}

function getTermLabel(locale: string, term: string) {
  const suffix = locale === "en" ? "days" : "dias";

  return `${term} ${suffix}`;
}

function SuppliersHeader() {
  const { q: search, setQ: setSearch } = useSuppliersFilters();
  const { header } = useSuppliersContent();
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

      <div className="grid gap-3 sm:grid-cols-[minmax(0,300px)_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-card pl-10"
            onChange={(event) => void setSearch(event.target.value || null)}
            placeholder={header.searchPlaceholder}
            value={search}
          />
        </div>
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

function SupplierMetrics() {
  const content = useSuppliersContent();

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {content.metrics.map(([label, value, description, tone], index) => {
        const Icon = metricIcons[index] ?? ChartIcon;

        return (
          <Card key={label} className="animate-nitro-scale-in">
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <p className="flex-1 text-sm text-muted-foreground">{label}</p>
                <div className={cn("flex size-8 items-center justify-center", toneStyles[String(tone)])}>
                  <Icon className="size-4" />
                </div>
              </div>
              <strong className="text-[26px] font-semibold leading-none text-foreground">
                {value}
              </strong>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function SupplierFilterBar() {
  const { setStatus: setFilter, status: filter } = useSuppliersFilters();
  const content = useSuppliersContent();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {content.filters.map(([value, label]) => {
        const active = filter === value;

        return (
          <Button
            key={value}
            className={cn("h-9 shrink-0 px-3", active && "bg-secondary")}
            onClick={() => void setFilter(value === "all" ? null : value)}
            variant={active ? "secondary" : "outline"}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function statusVariant(status: string) {
  return ["Delayed", "Payable", "Atrasado", "A pagar", "Por pagar"].includes(status)
    ? "warning"
    : "outline";
}

function SupplierTableCard() {
  const content = useSuppliersContent();
  const { emptyState, hasSuppliers, table } = content;
  const basePath = useSuppliersBasePath();
  const tableHeads =
    "heads" in table
      ? table.heads
      : ["Supplier", "PO", "Delivery", "Value", "Terms", "Status"];

  return (
    <Card className="min-h-[520px]">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">{table.title}</h2>
            <p className="text-sm text-muted-foreground">{table.description}</p>
          </div>
          <Button className="h-9 px-3" variant="outline">
            {table.termsLabel}
          </Button>
        </div>

        {hasSuppliers ? (
          <Table>
            <TableHeader>
              <TableRow>
                {tableHeads.map((head, index) => (
                  <TableHead key={head} className={index === tableHeads.length - 1 ? "text-right" : undefined}>
                    {head}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map(([supplier, id, delivery, value, terms, status]) => (
                <TableRow key={id}>
                  <TableCell className="min-w-[190px] font-medium text-foreground">
                    <Link
                      className="hover:text-primary"
                      href={`${basePath}/${toSupplierRouteId(id || supplier)}/edit`}
                    >
                      {supplier}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{id}</TableCell>
                  <TableCell className="text-muted-foreground">{delivery}</TableCell>
                  <TableCell className="text-muted-foreground">{value}</TableCell>
                  <TableCell className="text-muted-foreground">{terms}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            actionHref={`${basePath}/create`}
            actionLabel={emptyState.action}
            description={emptyState.description}
            title={emptyState.tableTitle}
          />
        )}
      </CardContent>
    </Card>
  );
}

function useSuppliersBasePath() {
  const params = useParams<{ role?: string }>();
  const role = params.role ?? "manager";

  return `/${role}/dashboard/suppliers`;
}

function toSupplierRouteId(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SupplierBulkActions() {
  const { bulkActions } = useSuppliersContent();

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-3">
        <BoxIcon className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{bulkActions.selected}</span>
        <p className="text-sm text-muted-foreground">{bulkActions.hint}</p>
      </CardContent>
    </Card>
  );
}

function SupplierDetailRail() {
  const content = useSuppliersContent();
  const { deliveryPlan, emptyState, hasSuppliers, nextActions, selectedSupplier } = content;
  const labels = "labels" in content ? content.labels : { nextActions: "Next actions" };
  const basePath = useSuppliersBasePath();

  return (
    <aside className="grid min-w-0 gap-2 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center bg-primary text-primary-foreground">
              <BoxIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-6">{selectedSupplier.name}</h2>
              <p className="break-words text-xs leading-5 text-white/80">
                {selectedSupplier.description}
              </p>
            </div>
          </div>
          {selectedSupplier.stats.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-xs text-white/80">{label}</span>
              <strong className="text-xs font-semibold">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3">
          <h2 className="text-base font-semibold text-foreground">{deliveryPlan.title}</h2>
          {hasSuppliers ? (
            deliveryPlan.rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <strong className="text-xs font-semibold text-foreground">{value}</strong>
              </div>
            ))
          ) : (
            <p className="break-words text-xs leading-5 text-muted-foreground">
              {emptyState.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3">
          <h2 className="text-base font-semibold text-foreground">{labels.nextActions}</h2>
          {nextActions.length > 0 ? (
            nextActions.map((action) => (
              <div key={action} className="flex items-center gap-2 py-0.5">
                <CheckIcon className="size-4 text-muted-foreground" />
                <span className="text-xs text-foreground">{action}</span>
              </div>
            ))
          ) : (
            <Button asChild className="h-9 justify-center" variant="outline">
              <Link href={`${basePath}/create`}>
                <PlusIcon className="size-4" />
                {emptyState.action}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function EmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  title: string;
}) {
  return (
    <div className="grid min-h-[320px] place-items-center border border-dashed border-border bg-muted/40 p-6 text-center">
      <div className="grid max-w-[360px] justify-items-center gap-3">
        <div className="flex size-11 items-center justify-center bg-primary text-primary-foreground">
          <BoxIcon className="size-5" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button asChild className="h-10 px-4">
          <Link href={actionHref}>
            <PlusIcon className="size-4" />
            {actionLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function SuppliersRoute() {
  const { sidebar } = useSuppliersContent();

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={sidebar.operatorRole}
      status={sidebar.status}
    >
      <SuppliersHeader />
      <SupplierMetrics />
      <SupplierFilterBar />
      <div className="grid min-h-0 min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
        <div className="grid min-w-0 gap-4">
          <SupplierTableCard />
          <SupplierBulkActions />
        </div>
        <SupplierDetailRail />
      </div>
    </DashboardShell>
  );
}
