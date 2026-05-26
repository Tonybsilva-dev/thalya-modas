"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
} from "@thalya-modas/ui";

import {
  BoxIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  UsersIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { customersContent } from "../domain/customers-content";

function PromissoryHeader() {
  const { promissory } = customersContent;

  return (
    <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <UsersIcon className="size-4" />
          {promissory.breadcrumb}
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
          {promissory.title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {promissory.description}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {promissory.actions.map((action, index) => (
          <Button
            key={action}
            className="h-11 px-4"
            variant={index === 0 ? "default" : "outline"}
          >
            {index === 0 ? <PlusIcon className="size-4" /> : <BoxIcon className="size-4" />}
            {action}
          </Button>
        ))}
      </div>
    </header>
  );
}

function PromissoryMetrics() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {customersContent.promissory.metrics.map(([label, value, description]) => (
        <Card key={label}>
          <CardContent className="grid gap-2.5 p-4">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm font-medium text-muted-foreground">{label}</p>
              <ClockIcon className="size-4 text-muted-foreground" />
            </div>
            <strong className="text-2xl font-semibold text-foreground">{value}</strong>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function OpenInstallments() {
  const { promissory } = customersContent;

  return (
    <Card>
      <CardContent className="grid gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Parcelas em aberto</h2>
          <span className="text-xs text-muted-foreground">3 pendentes</span>
        </div>
        {promissory.installments.map(([date, due, value, status]) => (
          <div key={date} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{date}</p>
              <p className="text-xs text-muted-foreground">{due}</p>
            </div>
            <span className="text-sm font-medium text-foreground">{value}</span>
            <Badge variant={status === "Atrasada" ? "warning" : "outline"}>{status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CreditPurchaseHistory() {
  const { promissory } = customersContent;

  return (
    <Card>
      <CardContent className="grid gap-3 p-5">
        <h2 className="text-lg font-semibold text-foreground">Histórico de compras a prazo</h2>
        {promissory.purchases.map(([title, date, value]) => (
          <div key={title} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            <span className="text-sm text-foreground">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PromissoryRail() {
  const { promissory } = customersContent;

  return (
    <aside className="grid gap-4 xl:w-[340px]">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">Timeline financeira</h2>
          {promissory.timeline.map(([title, description]) => (
            <div key={title} className="flex gap-2.5">
              <ClockIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-2 p-4">
          <p className="text-xs font-semibold">{promissory.risk.label}</p>
          <h2 className="text-2xl font-semibold">{promissory.risk.value}</h2>
          <div className="h-2 bg-white/20">
            <div className="h-full w-3/5 bg-white" />
          </div>
          <p className="text-sm text-white/80">{promissory.risk.description}</p>
        </CardContent>
      </Card>
    </aside>
  );
}

export function CustomerPromissoryRoute() {
  const { promissory, sidebar } = customersContent;

  return (
    <DashboardShell
      activeItem="Customers"
      operatorRole={sidebar.operatorRole}
      status={sidebar.promissoryStatus}
    >
      <PromissoryHeader />
      <Alert variant="warning">
        <CheckIcon className="size-5" />
        <AlertTitle>{promissory.alertTitle}</AlertTitle>
        <AlertDescription>{promissory.alertDescription}</AlertDescription>
      </Alert>
      <PromissoryMetrics />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <OpenInstallments />
          <CreditPurchaseHistory />
        </div>
        <PromissoryRail />
      </div>
    </DashboardShell>
  );
}
