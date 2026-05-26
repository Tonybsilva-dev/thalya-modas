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
import { useQueryState } from "nuqs";

import {
  BoxIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { suppliersContent } from "../domain/suppliers-content";

const toneStyles = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const metricIcons = [BoxIcon, CheckIcon, ClockIcon, ChartIcon];

function SuppliersHeader() {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });
  const { header } = suppliersContent;

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

function SupplierMetrics() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {suppliersContent.metrics.map(([label, value, description, tone], index) => {
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

function SupplierFilterBar() {
  const [filter, setFilter] = useQueryState("filter", { defaultValue: "all" });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {suppliersContent.filters.map(([value, label]) => {
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
  return ["Delayed", "Payable"].includes(status) ? "warning" : "outline";
}

function SupplierTableCard() {
  const { table } = suppliersContent;

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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>PO</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map(([supplier, po, delivery, value, terms, status]) => (
              <TableRow key={po}>
                <TableCell className="min-w-[190px] font-medium text-foreground">
                  {supplier}
                </TableCell>
                <TableCell className="text-muted-foreground">{po}</TableCell>
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
      </CardContent>
    </Card>
  );
}

function SupplierBulkActions() {
  const { bulkActions } = suppliersContent;

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
  const { deliveryPlan, nextActions, selectedSupplier } = suppliersContent;

  return (
    <aside className="grid gap-2 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center bg-primary text-primary-foreground">
              <BoxIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">{selectedSupplier.name}</h2>
              <p className="truncate text-xs text-white/80">{selectedSupplier.description}</p>
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
          {deliveryPlan.rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <strong className="text-xs font-semibold text-foreground">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3">
          <h2 className="text-base font-semibold text-foreground">Next actions</h2>
          {nextActions.map((action) => (
            <div key={action} className="flex items-center gap-2 py-0.5">
              <CheckIcon className="size-4 text-muted-foreground" />
              <span className="text-xs text-foreground">{action}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function SuppliersRoute() {
  const { sidebar } = suppliersContent;

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={sidebar.operatorRole}
      status={sidebar.status}
    >
      <SuppliersHeader />
      <SupplierMetrics />
      <SupplierFilterBar />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <SupplierTableCard />
          <SupplierBulkActions />
        </div>
        <SupplierDetailRail />
      </div>
    </DashboardShell>
  );
}
