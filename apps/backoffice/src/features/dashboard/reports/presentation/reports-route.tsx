"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  cn,
} from "@thalya-modas/ui";
import { useLocale } from "next-intl";

import { normalizeLocale } from "@/src/shared/i18n/locales";

import { useDashboardReportsQuery } from "../../shared/application/dashboard-api";
import { useReportsFilters } from "../../shared/application/dashboard-filters";
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  StoreIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { reportsContentByLocale } from "../domain/reports-content";

function useReportsContent() {
  const fallback = reportsContentByLocale[normalizeLocale(useLocale())];
  const { query } = useReportsFilters();
  const { data } = useDashboardReportsQuery(query);

  if (!data) return fallback;

  return {
    ...fallback,
    metrics: data.summary.map((metric) => [
      metric.value,
      metric.label,
      metric.description,
    ]),
    catalog: data.reports.map((report, index): [string, string, boolean] => [
      String(report.name ?? ""),
      String(report.status ?? ""),
      index === 0,
    ]),
    preview: {
      ...fallback.preview,
      weeks: data.periods.map((period, index) => [
        period,
        data.series[0]?.values[index] ?? 0,
      ]),
      table: data.series.map((serie) => [
        serie.name,
        String(serie.values.at(-1) ?? "-"),
        `${serie.values.length} pts`,
      ]),
    },
  };
}

function ReportsHeader() {
  const { header } = useReportsContent();

  return (
    <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
          {header.title}
        </h1>
        <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
          {header.description}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {header.actions.map((action, index) => (
          <Button
            key={action}
            className="h-11 px-4"
            variant={index === 2 ? "default" : "outline"}
          >
            {index === 0 && <CalendarIcon className="size-4" />}
            {index === 1 && <DownloadIcon className="size-4" />}
            {index === 2 && <PlusIcon className="size-4" />}
            {action}
          </Button>
        ))}
      </div>
    </header>
  );
}

function ReportFilters() {
  const { q: search, setQ: setSearch } = useReportsFilters();
  const controlIcons = [CalendarIcon, StoreIcon, FileTextIcon];
  const content = useReportsContent();
  const labels = "labels" in content ? content.labels : { filters: "Filters" };

  return (
    <Card>
      <CardContent className="grid gap-2.5 p-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,140px)_auto]">
        <div className="relative min-w-0">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-background pl-10"
            onChange={(event) => void setSearch(event.target.value || null)}
            placeholder={content.searchPlaceholder}
            value={search}
          />
        </div>
        {content.controls.map((control, index) => {
          const Icon = controlIcons[index] ?? ClockIcon;

          return (
            <div key={control} className="flex h-10 items-center gap-2 bg-background px-3">
              <Icon className="size-[15px] shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium text-foreground">{control}</span>
            </div>
          );
        })}
        <Button className="h-10 px-3" variant="outline">
          <SlidersIcon className="size-[15px]" />
          {labels.filters}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportMetrics() {
  const content = useReportsContent();

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {content.metrics.map(([value, label, description]) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-3.5">
            <div className="grid size-[34px] shrink-0 place-items-center bg-muted text-sm font-semibold text-foreground">
              {value}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-foreground">{label}</h2>
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function ReportCatalog() {
  const content = useReportsContent();
  const labels = "labels" in content ? content.labels : { templates: "Templates" };

  return (
    <Card className="xl:w-[360px]">
      <CardContent className="grid gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">{labels.templates}</h2>
          <span className="text-sm text-muted-foreground">{content.catalog.length}</span>
        </div>
        {content.catalog.map(([title, description, active]) => (
          <div
            key={title}
            className={cn(
              "flex items-center gap-3 p-3",
              active ? "bg-secondary text-secondary-foreground" : "bg-background",
            )}
          >
            <div
              className={cn(
                "flex size-9 items-center justify-center",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <FileTextIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={cn("truncate text-sm font-semibold", active ? "text-secondary-foreground" : "text-foreground")}>
                {title}
              </h3>
              <p className={cn("mt-1 text-xs leading-5", active ? "text-white/80" : "text-muted-foreground")}>
                {description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReportPreview() {
  const { preview } = useReportsContent();

  return (
    <div className="grid min-w-0 gap-3">
      <Card className="min-h-[420px]">
        <CardContent className="grid h-full gap-3.5 p-[18px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold text-foreground">{preview.title}</h2>
              <p className="text-xs text-muted-foreground">{preview.description}</p>
            </div>
            <Badge variant="success">{preview.status}</Badge>
          </div>

          <div className="grid gap-2.5 bg-background p-3.5">
            <h3 className="text-sm font-semibold text-foreground">{preview.chartTitle}</h3>
            <div className="grid h-[104px] grid-cols-5 items-end gap-3">
              {preview.weeks.map(([week, height]) => (
                <div key={week} className="grid gap-2">
                  <div className="flex h-24 items-end">
                    <div className="w-full bg-primary" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-center text-xs text-muted-foreground">{week}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid bg-background">
            {preview.table.map(([metric, current, delta]) => (
              <div key={metric} className="grid grid-cols-[minmax(0,1fr)_120px_90px] gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
                <span className="truncate text-sm font-medium text-foreground">{metric}</span>
                <span className="text-sm text-foreground">{current}</span>
                <span className="text-sm text-muted-foreground">{delta}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {preview.options.map(([title, description]) => (
          <Card key={title}>
            <CardContent className="grid gap-1 p-3">
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
              <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportsActivityRail() {
  const content = useReportsContent();
  const labels =
    "labels" in content
      ? content.labels
      : { recentExports: "Recent exports", scheduled: "Scheduled" };

  return (
    <aside className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardContent className="grid gap-2 p-3.5">
          <h2 className="text-base font-semibold text-foreground">{labels.scheduled}</h2>
          {content.scheduled.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-3.5">
          <h2 className="text-base font-semibold text-foreground">{labels.recentExports}</h2>
          {content.exports.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function ReportsRoute() {
  const { sidebar } = useReportsContent();

  return (
    <DashboardShell activeItem="Reports" operatorRole={sidebar.operatorRole} status={sidebar.status}>
      <ReportsHeader />
      <ReportFilters />
      <ReportMetrics />
      <div className="grid min-h-0 gap-[18px] xl:grid-cols-[360px_minmax(0,1fr)]">
        <ReportCatalog />
        <div className="grid min-w-0 gap-3.5">
          <ReportPreview />
          <ReportsActivityRail />
        </div>
      </div>
    </DashboardShell>
  );
}
