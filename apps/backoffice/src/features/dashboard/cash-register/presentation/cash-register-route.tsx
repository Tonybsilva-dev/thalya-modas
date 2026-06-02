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
import { CreditCard, CurrencyDollar, QrCode } from "@phosphor-icons/react";

import { normalizeLocale } from "@/src/shared/i18n/locales";

import {
  BoxIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { cashRegisterContentByLocale } from "../domain/cash-register-content";

const toneStyles = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const metricIcons = [ChartIcon, CheckIcon, BoxIcon, ClockIcon];
const paymentIcons = [CreditCard, QrCode, CurrencyDollar];

function useCashRegisterContent() {
  return cashRegisterContentByLocale[normalizeLocale(useLocale())];
}

function CashRegisterHeader() {
  const [query, setQuery] = useQueryState("scan", { defaultValue: "" });
  const { header } = useCashRegisterContent();

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
            onChange={(event) => void setQuery(event.target.value || null)}
            placeholder={header.searchPlaceholder}
            value={query}
          />
        </div>
        <Button className="h-11 justify-center px-4" variant="secondary">
          <ClockIcon className="size-4" />
          {header.actionLabel}
        </Button>
      </div>
    </header>
  );
}

function RegisterMetrics() {
  const content = useCashRegisterContent();

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

function CurrentSaleCard() {
  const { currentSale } = useCashRegisterContent();
  const tableHeads =
    "heads" in currentSale ? currentSale.heads : ["Item", "Qty", "Price", "Total"];

  return (
    <Card className="min-h-[370px]">
      <CardContent className="flex h-full flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-foreground">{currentSale.title}</h2>
            <p className="text-xs text-muted-foreground">{currentSale.description}</p>
          </div>
          <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
            {currentSale.status}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {tableHeads.map((head, index) => (
                  <TableHead
                    key={head}
                    className={cn("h-8 px-3", index === tableHeads.length - 1 && "text-right")}
                  >
                    {head}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSale.rows.map(([item, qty, price, total]) => (
                <TableRow key={item} className="h-[42px] bg-card hover:bg-card">
                  <TableCell className="min-w-[260px] px-3 py-2 text-xs font-medium text-foreground">
                    {item}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-xs text-muted-foreground">{qty}</TableCell>
                  <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                    {price}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="min-h-32 flex-1 bg-muted/60" />
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentMethods() {
  const content = useCashRegisterContent();

  return (
    <div className="grid items-start gap-4 md:grid-cols-3">
      {content.paymentMethods.map(([label, value, tone], index) => {
        const active = tone === "secondary";
        const Icon = paymentIcons[index] ?? CreditCard;

        return (
          <Card
            key={label}
            className={cn("h-16", active && "bg-secondary text-secondary-foreground")}
          >
            <CardContent className="flex h-full items-center gap-3 p-3">
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-secondary-foreground" : "text-muted-foreground",
                )}
                weight="regular"
              />
              <div className="grid min-w-0 gap-0.5">
                <span className={cn("truncate text-xs font-semibold", active ? "text-secondary-foreground" : "text-foreground")}>
                  {label}
                </span>
                <span className={cn("truncate text-[11px]", active ? "text-white/80" : "text-muted-foreground")}>
                  {value}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ReceiptSummary() {
  const { receipt } = useCashRegisterContent();

  return (
    <Card className="bg-secondary text-secondary-foreground">
      <CardContent className="grid gap-3 p-4">
        <p className="text-xs font-semibold">{receipt.label}</p>
        <strong className="text-[34px] font-semibold leading-none">{receipt.total}</strong>
        <div className="grid gap-1">
          {receipt.rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-1">
              <span className="text-xs text-white/80">{label}</span>
              <strong className="text-xs font-semibold">{value}</strong>
            </div>
          ))}
        </div>
        <Button className="mt-1 h-10 justify-center">
          <PlusIcon className="size-4" />
          {receipt.actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function DrawerCount() {
  const content = useCashRegisterContent();
  const labels = "labels" in content ? content.labels : { drawerCount: "Drawer count" };

  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <h2 className="text-base font-semibold text-foreground">{labels.drawerCount}</h2>
        {content.drawerCount.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <strong className="text-xs font-semibold text-foreground">{value}</strong>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentTransactions() {
  const content = useCashRegisterContent();
  const labels =
    "labels" in content ? content.labels : { recentTransactions: "Recent transactions" };

  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <h2 className="text-base font-semibold text-foreground">
          {labels.recentTransactions}
        </h2>
        {content.transactions.map(([title, value]) => (
          <div key={title} className="flex items-center gap-3 py-0.5">
            <ClockIcon className="size-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-foreground">{title}</p>
              <p className="text-[11px] text-muted-foreground">{value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SettlementRail() {
  return (
    <aside className="grid gap-3 xl:w-[340px]">
      <ReceiptSummary />
      <DrawerCount />
      <RecentTransactions />
    </aside>
  );
}

export function CashRegisterRoute() {
  const { sidebar } = useCashRegisterContent();

  return (
    <DashboardShell
      activeItem="Cash register"
      operatorRole={sidebar.operatorRole}
      status={sidebar.status}
    >
      <CashRegisterHeader />
      <RegisterMetrics />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <CurrentSaleCard />
          <PaymentMethods />
        </div>
        <SettlementRail />
      </div>
    </DashboardShell>
  );
}
