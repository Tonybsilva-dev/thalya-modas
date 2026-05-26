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
import { inventoryContent } from "../domain/inventory-content";

const toneStyles = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const metricIcons = [BoxIcon, ClockIcon, CheckIcon, ChartIcon];

function InventoryHeader() {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });
  const { header } = inventoryContent;

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

      <div className="grid gap-3 md:grid-cols-[minmax(0,300px)_auto_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-card pl-10"
            onChange={(event) => void setSearch(event.target.value || null)}
            placeholder={header.searchPlaceholder}
            value={search}
          />
        </div>
        <Button className="h-11 justify-center px-4" variant="secondary">
          <BoxIcon className="size-4" />
          {header.scanLabel}
        </Button>
        <Button className="h-11 justify-center px-4">
          <PlusIcon className="size-4" />
          {header.actionLabel}
        </Button>
      </div>
    </header>
  );
}

function InventoryMetrics() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {inventoryContent.metrics.map(([label, value, description, tone], index) => {
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

function InventoryFilterBar() {
  const [filter, setFilter] = useQueryState("filter", { defaultValue: "all" });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {inventoryContent.filters.map(([value, label]) => {
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
  if (["Low", "Critical", "Supplier"].includes(status)) {
    return "warning";
  }

  return "outline";
}

function InventoryTableCard() {
  const { table } = inventoryContent;

  return (
    <Card className="min-h-[560px]">
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
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map(([item, sku, onHand, reserved, channel, status]) => (
              <TableRow key={sku}>
                <TableCell className="min-w-[260px] font-medium text-foreground">
                  {item}
                </TableCell>
                <TableCell className="text-muted-foreground">{sku}</TableCell>
                <TableCell className="text-muted-foreground">{onHand}</TableCell>
                <TableCell className="text-muted-foreground">{reserved}</TableCell>
                <TableCell className="text-muted-foreground">{channel}</TableCell>
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

function InventoryBulkActions() {
  const { bulkActions } = inventoryContent;

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

function InventoryDetailRail() {
  const { activity, reorderPlan, selectedItem } = inventoryContent;

  return (
    <aside className="grid gap-3 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-2.5">
          <div
            className="h-[88px] bg-cover bg-center"
            style={{ backgroundImage: `url(${selectedItem.image})` }}
          />
          <div className="grid gap-1 px-1 pb-1">
            <p className="text-xs font-semibold">{selectedItem.eyebrow}</p>
            <h2 className="text-base font-semibold">{selectedItem.name}</h2>
            <p className="text-xs text-white/80">{selectedItem.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-[17px] font-semibold text-foreground">{reorderPlan.title}</h2>
          <div className="grid gap-1">
            {reorderPlan.rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <strong className="text-sm font-semibold text-foreground">{value}</strong>
              </div>
            ))}
          </div>
          <Button className="mt-1 h-10 justify-center">
            <PlusIcon className="size-4" />
            {reorderPlan.actionLabel}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-[17px] font-semibold text-foreground">Recent activity</h2>
          {activity.map(([title, time]) => (
            <div key={title} className="flex gap-2.5 py-0.5">
              <ClockIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="grid gap-0.5">
                <span className="text-xs text-foreground">{title}</span>
                <span className="text-[10px] text-muted-foreground">{time}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function InventoryRoute() {
  const { sidebar } = inventoryContent;

  return (
    <DashboardShell
      activeItem="Inventory"
      operatorRole={sidebar.operatorRole}
      status={sidebar.status}
    >
      <InventoryHeader />
      <InventoryMetrics />
      <InventoryFilterBar />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <InventoryTableCard />
          <InventoryBulkActions />
        </div>
        <InventoryDetailRail />
      </div>
    </DashboardShell>
  );
}
