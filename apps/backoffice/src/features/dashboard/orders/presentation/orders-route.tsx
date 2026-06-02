"use client";

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

import { useDashboardOrdersQuery } from "../../shared/application/dashboard-api";
import { useOrdersFilters } from "../../shared/application/dashboard-filters";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import {
  BoxIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
} from "../../overview/presentation/dashboard-icons";
import { ordersContentByLocale } from "../domain/orders-content";

const toneStyles: Record<string, string> = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const metricIcons = [BoxIcon, CheckIcon, ClockIcon, ChartIcon];

function useOrdersContent() {
  const fallback = ordersContentByLocale[normalizeLocale(useLocale())];
  const { query } = useOrdersFilters();
  const { data } = useDashboardOrdersQuery(query);

  if (!data) return fallback;

  return {
    ...fallback,
    metrics: data.summary.map((metric) => [
      metric.label,
      metric.value,
      metric.description,
      metric.tone,
    ]),
    table: {
      ...fallback.table,
      rows: data.orders.map((order) => [
        String(order.id ?? ""),
        String(order.customer ?? ""),
        String(order.channel ?? ""),
        String(order.total ?? ""),
        String(order.due ?? "-"),
        String(order.status ?? ""),
      ]),
    },
    selectedOrder: {
      ...fallback.selectedOrder,
      title: String(data.orders[0]?.id ?? fallback.selectedOrder.title),
      description: String(data.orders[0]?.customer ?? fallback.selectedOrder.description),
      meta: [
        ["Status", String(data.orders[0]?.status ?? "-")],
        ["Channel", String(data.orders[0]?.channel ?? "-")],
        ["Total", String(data.orders[0]?.total ?? "-")],
      ],
    },
  };
}

function OrdersHeader() {
  const { q: search, setQ: setSearch } = useOrdersFilters();
  const { header } = useOrdersContent();

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
        <Button className="h-11 justify-center px-4">
          <PlusIcon className="size-4" />
          {header.actionLabel}
        </Button>
      </div>
    </header>
  );
}

function OrdersMetrics() {
  const content = useOrdersContent();

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {content.metrics.map(([label, value, description, tone], index) => {
        const Icon = metricIcons[index] ?? ChartIcon;

        return (
          <Card key={label} className="animate-nitro-scale-in">
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <p className="flex-1 text-sm text-muted-foreground">{label}</p>
                <div className={cn("flex size-8 items-center justify-center", toneStyles[tone])}>
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

function FilterBar() {
  const { setStatus, status } = useOrdersFilters();
  const content = useOrdersContent();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {content.filters.map(([value, label]) => {
        const active = status === value;

        return (
          <Button
            key={value}
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

function statusVariant(status: string) {
  if (
    [
      "Packing",
      "Payment",
      "Late",
      "Separando",
      "Pagamento",
      "Atrasado",
      "Preparando",
      "Pago",
    ].includes(status)
  ) {
    return "warning";
  }

  return "outline";
}

function OrdersTableCard() {
  const { table } = useOrdersContent();
  const tableHeads = "heads" in table ? table.heads : ["Order", "Customer", "Channel", "Total", "Due", "Status"];

  return (
    <Card className="min-h-[520px]">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">{table.title}</h2>
            <p className="text-sm text-muted-foreground">{table.description}</p>
          </div>
          <Button className="h-9 px-3" variant="outline">
            {table.exportLabel}
          </Button>
        </div>

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
            {table.rows.map(([order, customer, channel, total, due, status]) => (
              <TableRow key={order}>
                <TableCell className="font-medium text-muted-foreground">{order}</TableCell>
                <TableCell className="min-w-[180px] font-medium text-foreground">
                  {customer}
                </TableCell>
                <TableCell className="text-muted-foreground">{channel}</TableCell>
                <TableCell className="text-muted-foreground">{total}</TableCell>
                <TableCell className="text-muted-foreground">{due}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={statusVariant(status)}>{status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OrderBulkActions() {
  const { bulkActions } = useOrdersContent();

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

function OrderDetailRail() {
  const content = useOrdersContent();
  const { selectedOrder } = content;
  const labels =
    "labels" in content
      ? content.labels
      : { nextActions: "Next actions", packingChecklist: "Packing checklist" };

  return (
    <aside className="grid gap-3 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center bg-primary text-primary-foreground">
              <BoxIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">{selectedOrder.title}</h2>
              <p className="truncate text-xs text-white/80">{selectedOrder.description}</p>
            </div>
          </div>

          <div className="grid gap-1">
            {selectedOrder.meta.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-1">
                <span className="text-xs text-white/80">{label}</span>
                <strong className="text-xs font-semibold">{value}</strong>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">{labels.packingChecklist}</h2>
          {content.packingChecklist.map(([item, checked]) => (
            <div key={item} className="flex items-center gap-2.5 py-0.5">
              <CheckIcon
                className={cn(
                  "size-4",
                  checked ? "text-success-foreground" : "text-muted-foreground",
                )}
              />
              <span className="text-xs text-foreground">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">{labels.nextActions}</h2>
          {content.nextActions.map(([title, description]) => (
            <div key={title} className="flex gap-2.5 py-0.5">
              <ClockIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="grid gap-0.5">
                <span className="text-xs text-foreground">{title}</span>
                <span className="text-[11px] text-muted-foreground">{description}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function OrdersRoute() {
  const { sidebar } = useOrdersContent();

  return (
    <DashboardShell activeItem="Orders" operatorRole={sidebar.operatorRole} status={sidebar.status}>
      <OrdersHeader />
      <OrdersMetrics />
      <FilterBar />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <OrdersTableCard />
          <OrderBulkActions />
        </div>
        <OrderDetailRail />
      </div>
    </DashboardShell>
  );
}
