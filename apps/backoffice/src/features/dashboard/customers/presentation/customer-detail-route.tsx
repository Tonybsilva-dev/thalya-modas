"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
} from "@thalya-modas/ui";
import { useLocale } from "next-intl";

import { normalizeLocale } from "@/src/shared/i18n/locales";

import {
  CheckIcon,
  ClockIcon,
  PlusIcon,
  UsersIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { useDashboardCustomerDetailQuery } from "../../shared/application/dashboard-api";
import { customersContentByLocale } from "../domain/customers-content";

function useCustomersContent() {
  const fallback = customersContentByLocale[normalizeLocale(useLocale())];
  const params = useParams<{ customerId?: string }>();
  const customerId = params.customerId ?? "mariana-costa";
  const { data } = useDashboardCustomerDetailQuery(customerId);

  if (!data) return fallback;

  return {
    ...fallback,
    detail: {
      ...fallback.detail,
      breadcrumb: `Customers / ${data.name}`,
      description: data.description,
      email: `${data.email} - ${data.phone}`,
      name: data.name,
      notes: data.notes,
      tags: data.tags,
      stats: data.stats.map((row) => [String(row.label ?? ""), String(row.value ?? "")]),
      recentOrders: data.recentOrders.map((row) => [
        String(row.order ?? ""),
        String(row.date ?? ""),
        String(row.total ?? ""),
        String(row.status ?? ""),
      ]),
      loyaltyTier: data.loyaltyTier,
      nextActions: data.nextActions,
      timeline: data.timeline.map((row) => [
        String(row.title ?? ""),
        String(row.date ?? ""),
      ]),
    },
  };
}

function DetailHeader() {
  const { detail } = useCustomersContent();

  return (
    <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <UsersIcon className="size-4" />
          {detail.breadcrumb}
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
          {detail.name}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {detail.description}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {detail.actions.map((action, index) => (
          <Button
            key={action}
            className="h-11 px-4"
            variant={index === 2 ? "default" : "outline"}
          >
            {index === 2 ? <PlusIcon className="size-4" /> : <UsersIcon className="size-4" />}
            {action}
          </Button>
        ))}
      </div>
    </header>
  );
}

function CustomerSummary() {
  const { detail } = useCustomersContent();

  return (
    <Card>
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[88px_minmax(0,1fr)]">
        <div className="flex size-[88px] items-center justify-center bg-secondary text-[26px] font-semibold text-secondary-foreground">
          MC
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{detail.name}</h2>
                <p className="text-sm text-muted-foreground">{detail.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((tag, index) => (
                  <Badge key={tag} variant={index === 1 ? "success" : "outline"}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {detail.stats.map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <strong className="text-lg font-semibold text-foreground">{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailTabs() {
  const content = useCustomersContent();
  const { detail, labels } = content;

  return (
    <div className="flex gap-2 overflow-x-auto bg-muted p-1">
      {detail.tabs.map((tab, index) => (
        <Button
          key={tab}
          className="h-9 shrink-0 px-3"
          variant={index === 0 ? "outline" : "ghost"}
        >
          {tab}
        </Button>
      ))}
      <Button asChild className="h-9 shrink-0 px-3" variant="ghost">
        <Link href="/manager/dashboard/customers/mariana-costa/promissory">
          {labels.promissory}
        </Link>
      </Button>
    </div>
  );
}

function RecentOrders() {
  const { detail, labels } = useCustomersContent();

  return (
    <Card className="min-h-[320px]">
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{labels.recentOrders}</h2>
          <Button className="h-8 px-0 text-primary" variant="link">
            {labels.viewAll}
          </Button>
        </div>
        {detail.recentOrders.map(([order, date, total, status]) => (
          <div key={order} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{order}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            <span className="text-sm text-foreground">{total}</span>
            <Badge variant="outline">{status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RelationshipNotes() {
  const { detail, labels } = useCustomersContent();

  return (
    <Card className="lg:w-[330px]">
      <CardContent className="grid gap-3 p-5">
        <h2 className="text-lg font-semibold text-foreground">{labels.relationshipNotes}</h2>
        {detail.notes.map((note) => (
          <div key={note} className="flex gap-2">
            <CheckIcon className="mt-0.5 size-4 text-muted-foreground" />
            <p className="text-sm leading-6 text-foreground">{note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DetailRail() {
  const { detail, labels } = useCustomersContent();

  return (
    <aside className="grid gap-4 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-5">
          <p className="text-xs font-semibold">{labels.loyaltyTier}</p>
          <h2 className="text-2xl font-semibold">{detail.loyaltyTier.title}</h2>
          <div className="h-2 bg-white/20">
            <div className="h-full w-3/4 bg-white" />
          </div>
          <p className="text-sm text-white/80">{detail.loyaltyTier.description}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">{labels.nextBestActions}</h2>
          {detail.nextActions.map((action) => (
            <div key={action} className="flex items-center gap-2 bg-background p-2.5">
              <CheckIcon className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{action}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">{labels.timeline}</h2>
          {detail.timeline.map(([title, date]) => (
            <div key={title} className="flex gap-2.5">
              <ClockIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{date}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function CustomerDetailRoute() {
  const { sidebar } = useCustomersContent();

  return (
    <DashboardShell
      activeItem="Customers"
      operatorRole={sidebar.operatorRole}
      status={sidebar.detailStatus}
    >
      <DetailHeader />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <CustomerSummary />
          <DetailTabs />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
            <RecentOrders />
            <RelationshipNotes />
          </div>
        </div>
        <DetailRail />
      </div>
    </DashboardShell>
  );
}
