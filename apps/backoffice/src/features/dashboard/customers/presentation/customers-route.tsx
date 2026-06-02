"use client";

import Link from "next/link";
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

import {
  BoxIcon,
  ChartIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { customersContentByLocale } from "../domain/customers-content";

const toneStyles = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const metricIcons = [UsersIcon, CheckIcon, BoxIcon, ChartIcon];

function useCustomersContent() {
  return customersContentByLocale[normalizeLocale(useLocale())];
}

function CustomersHeader() {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });
  const { header } = useCustomersContent();

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
      <div className="grid gap-3 md:grid-cols-[minmax(0,310px)_auto_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-card pl-10"
            onChange={(event) => void setSearch(event.target.value || null)}
            placeholder={header.searchPlaceholder}
            value={search}
          />
        </div>
        <Button className="h-11 px-4" variant="secondary">
          <UsersIcon className="size-4" />
          {header.campaignLabel}
        </Button>
        <Button className="h-11 px-4">
          <PlusIcon className="size-4" />
          {header.actionLabel}
        </Button>
      </div>
    </header>
  );
}

function CustomersMetrics() {
  const content = useCustomersContent();

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

function CustomersFilterBar() {
  const [segment, setSegment] = useQueryState("segment", { defaultValue: "all" });
  const content = useCustomersContent();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {content.filters.map(([value, label]) => {
        const active = segment === value;
        return (
          <Button
            key={value}
            className={cn("h-9 shrink-0 px-3", active && "bg-secondary")}
            onClick={() => void setSegment(value === "all" ? null : value)}
            variant={active ? "secondary" : "outline"}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function warningBadge(label: string) {
  return [
    "VIP",
    "Birthday",
    "At risk",
    "Reserve dress",
    "Gift coupon",
    "WhatsApp",
    "Aniversario",
    "Em risco",
    "Reservar vestido",
    "Cupom presente",
    "Cumpleanos",
    "En riesgo",
    "Cupon regalo",
  ].includes(label)
    ? "warning"
    : "outline";
}

function CustomersTableCard() {
  const { table } = useCustomersContent();
  const tableHeads =
    "heads" in table
      ? table.heads
      : ["Customer", "Phone", "Last buy", "Lifetime", "Segment", "Next action"];

  return (
    <Card className="min-h-[560px]">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">{table.title}</h2>
            <p className="text-sm text-muted-foreground">{table.description}</p>
          </div>
          <Button className="h-9 px-3" variant="outline">
            {table.segmentLabel}
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
            {table.rows.map(([customer, phone, lastBuy, lifetime, segment, action]) => (
              <TableRow key={phone}>
                <TableCell className="min-w-[170px] font-medium text-foreground">
                  <Link className="hover:text-primary" href="/manager/dashboard/customers/mariana-costa">
                    {customer}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{phone}</TableCell>
                <TableCell className="text-muted-foreground">{lastBuy}</TableCell>
                <TableCell className="text-muted-foreground">{lifetime}</TableCell>
                <TableCell>
                  <Badge variant={warningBadge(segment)}>{segment}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={warningBadge(action)}>{action}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CustomerBulkActions() {
  const { bulkActions } = useCustomersContent();
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-3">
        <UsersIcon className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{bulkActions.selected}</span>
        <p className="text-sm text-muted-foreground">{bulkActions.hint}</p>
      </CardContent>
    </Card>
  );
}

function CustomerListRail() {
  const content = useCustomersContent();
  const { rail } = content;
  const labels = content.labels;

  return (
    <aside className="grid gap-2 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center bg-primary text-base font-semibold text-primary-foreground">
              {rail.initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[19px] font-semibold">{rail.name}</h2>
              <p className="truncate text-xs text-white/80">{rail.description}</p>
            </div>
          </div>
          {rail.stats.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-xs text-white/80">{label}</span>
              <strong className="text-xs font-semibold">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3">
          <h2 className="text-base font-semibold text-foreground">{labels.loyaltyStatus}</h2>
          <p className="text-xs leading-5 text-muted-foreground">{rail.loyalty}</p>
          <div className="h-2 bg-muted">
            <div className="h-full w-2/3 bg-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3">
          <h2 className="text-base font-semibold text-foreground">{labels.nextBestActions}</h2>
          {rail.actions.map((action) => (
            <div key={action} className="flex items-center gap-2 py-0.5">
              <CheckIcon className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{action}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3">
          <h2 className="text-base font-semibold text-foreground">{labels.recentPurchases}</h2>
          {rail.purchases.map(([item, meta]) => (
            <div key={item} className="grid gap-0.5 py-0.5">
              <span className="text-xs text-foreground">{item}</span>
              <span className="text-[10px] text-muted-foreground">{meta}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function CustomersRoute() {
  const { sidebar } = useCustomersContent();
  return (
    <DashboardShell activeItem="Customers" operatorRole={sidebar.operatorRole} status={sidebar.status}>
      <CustomersHeader />
      <CustomersMetrics />
      <CustomersFilterBar />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <CustomersTableCard />
          <CustomerBulkActions />
        </div>
        <CustomerListRail />
      </div>
    </DashboardShell>
  );
}
