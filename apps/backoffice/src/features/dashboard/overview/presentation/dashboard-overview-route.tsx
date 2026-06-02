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
import { useQueryState } from "nuqs";

import { normalizeLocale } from "@/src/shared/i18n/locales";

import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { dashboardOverviewContentByLocale } from "../domain/overview-content";
import {
  ChartIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
} from "./dashboard-icons";

const toneStyles = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

function useDashboardOverviewContent() {
  return dashboardOverviewContentByLocale[normalizeLocale(useLocale())];
}

function DashboardHeader() {
  const { header } = useDashboardOverviewContent();
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });

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

      <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_auto]">
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
          {header.newSaleLabel}
        </Button>
      </div>
    </header>
  );
}

function MetricGrid() {
  const content = useDashboardOverviewContent();

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {content.metrics.map((metric) => (
        <Card key={metric.label} className="animate-nitro-scale-in">
          <CardContent className="grid gap-3 p-4">
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm text-muted-foreground">{metric.label}</p>
              <div
                className={cn(
                  "flex size-8 items-center justify-center",
                  toneStyles[metric.tone],
                )}
              >
                <ChartIcon className="size-4" />
              </div>
            </div>
            <strong className="text-[26px] font-semibold leading-none text-foreground">
              {metric.value}
            </strong>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function SalesPulseCard() {
  const { salesPulse } = useDashboardOverviewContent();

  return (
    <Card className="min-h-[250px] flex-1">
      <CardContent className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">{salesPulse.title}</h2>
            <p className="text-sm text-muted-foreground">{salesPulse.description}</p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {salesPulse.status}
          </Badge>
        </div>

        <div className="grid flex-1 grid-cols-9 items-end gap-3">
          {salesPulse.bars.map((height, index) => (
            <div key={salesPulse.hours[index]} className="grid h-full min-h-36 items-end gap-2">
              <div className="flex h-32 items-end bg-muted/60">
                <div
                  className="w-full bg-primary transition-[height] duration-enter ease-nitro"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-center text-[11px] text-muted-foreground">
                {salesPulse.hours[index]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductSpotlightCard() {
  const { spotlight } = useDashboardOverviewContent();

  return (
    <Card className="min-h-[250px] bg-secondary text-secondary-foreground lg:w-[260px]">
      <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
        <div className="grid gap-3">
          <div className="flex size-10 items-center justify-center bg-white/15">
            <SparkIcon className="size-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-normal">{spotlight.eyebrow}</p>
          <h2 className="text-[19px] font-semibold leading-snug">{spotlight.name}</h2>
        </div>
        <p className="text-sm leading-6 text-white/80">{spotlight.description}</p>
      </CardContent>
    </Card>
  );
}

function InventoryRiskTable() {
  const { inventory } = useDashboardOverviewContent();
  const tableHeads =
    "heads" in inventory ? inventory.heads : ["Product", "SKU", "Stock", "Demand", "Action"];

  return (
    <Card className="min-h-[360px] flex-1">
      <CardContent className="grid gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">{inventory.title}</h2>
            <p className="text-sm text-muted-foreground">{inventory.description}</p>
          </div>
          <Badge variant="outline">{inventory.filter}</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {tableHeads.map((head, index) => (
                <TableHead
                  key={head}
                  className={index === tableHeads.length - 1 ? "text-right" : undefined}
                >
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.rows.map(([product, sku, stock, demand, action]) => (
              <TableRow key={sku}>
                <TableCell className="min-w-[220px] font-medium text-foreground">
                  {product}
                </TableCell>
                <TableCell className="text-muted-foreground">{sku}</TableCell>
                <TableCell className="text-muted-foreground">{stock}</TableCell>
                <TableCell className="text-muted-foreground">{demand}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={action === "Watch" || action === "Observar" ? "outline" : "warning"}
                    className="justify-center"
                  >
                    {action}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ActionRail() {
  const content = useDashboardOverviewContent();
  const locale = normalizeLocale(useLocale());
  const checklistTitle =
    locale === "pt-BR" ? "Checklist de hoje" : locale === "es" ? "Checklist de hoy" : "Today checklist";

  return (
    <aside className="grid gap-3 xl:w-[340px]">
      {content.actionRail.map((item) => (
        <Card key={item.title}>
          <CardContent className="grid gap-2 p-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex size-8 items-center justify-center", toneStyles[item.tone])}>
                <CheckIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="truncate text-xs text-muted-foreground">{item.value}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}

      <Card className="xl:flex-1">
        <CardContent className="grid gap-3.5 p-4">
          <h2 className="text-[17px] font-semibold text-foreground">{checklistTitle}</h2>
          {content.checklist.map(([task, time]) => (
            <div key={task} className="flex items-center gap-3 py-1">
              <span className="flex size-4 items-center justify-center border border-input">
                <span className="size-1.5 bg-primary" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task}</span>
              <span className="text-[11px] text-muted-foreground">{time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function DashboardOverviewRoute() {
  const { store } = useDashboardOverviewContent();

  return (
    <DashboardShell
      activeItem="Overview"
      operatorRole={store.operatorRole}
      status={store.status}
    >
      <DashboardHeader />
      <MetricGrid />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <SalesPulseCard />
            <ProductSpotlightCard />
          </div>
          <InventoryRiskTable />
        </div>
        <ActionRail />
      </div>
    </DashboardShell>
  );
}
