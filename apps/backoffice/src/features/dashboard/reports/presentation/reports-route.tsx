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
import { reportsContent } from "../domain/reports-content";

function ReportsHeader() {
  const { header } = reportsContent;

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
            {index === 2 ? <PlusIcon className="size-4" /> : <ClockIcon className="size-4" />}
            {action}
          </Button>
        ))}
      </div>
    </header>
  );
}

function ReportFilters() {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });

  return (
    <Card>
      <CardContent className="grid gap-2 p-3 lg:grid-cols-[repeat(4,190px)_minmax(0,1fr)]">
        {reportsContent.filters.map((filter) => (
          <div key={filter} className="flex h-10 items-center gap-2 bg-background px-3">
            <ClockIcon className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">{filter}</span>
          </div>
        ))}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-background pl-10"
            onChange={(event) => void setSearch(event.target.value || null)}
            placeholder={reportsContent.searchPlaceholder}
            value={search}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ReportMetrics() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {reportsContent.metrics.map(([label, value, description]) => (
        <Card key={label}>
          <CardContent className="grid gap-2.5 p-4">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm font-medium text-muted-foreground">{label}</p>
              <ChartIcon className="size-4 text-muted-foreground" />
            </div>
            <strong className="text-[23px] font-semibold leading-none text-foreground">
              {value}
            </strong>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function ReportCatalog() {
  return (
    <Card className="lg:w-[420px]">
      <CardContent className="grid gap-3 p-5">
        <h2 className="text-lg font-semibold text-foreground">Report catalog</h2>
        {reportsContent.catalog.map(([title, description, active]) => (
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
              <BoxIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={cn("text-sm font-semibold", active ? "text-secondary-foreground" : "text-foreground")}>
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
  const { preview } = reportsContent;

  return (
    <div className="grid min-w-0 gap-3">
      <Card>
        <CardContent className="grid gap-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold text-foreground">{preview.title}</h2>
              <p className="text-xs text-muted-foreground">{preview.description}</p>
            </div>
            <Badge variant="success">{preview.status}</Badge>
          </div>

          <div className="grid gap-3 bg-background p-3">
            <h3 className="text-sm font-semibold text-foreground">{preview.chartTitle}</h3>
            <div className="grid grid-cols-5 items-end gap-3">
              {preview.weeks.map(([value, week, height]) => (
                <div key={week} className="grid gap-2">
                  <span className="text-center text-[10px] text-muted-foreground">{value}</span>
                  <div className="flex h-28 items-end bg-muted">
                    <div className="w-full bg-primary" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-center text-xs text-foreground">{week}</span>
                </div>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.table.map(([metric, current, previous, delta]) => (
                <TableRow key={metric}>
                  <TableCell className="font-medium text-foreground">{metric}</TableCell>
                  <TableCell>{current}</TableCell>
                  <TableCell>{previous}</TableCell>
                  <TableCell>{delta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
  return (
    <aside className="grid gap-4 xl:w-[300px]">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">Scheduled</h2>
          {reportsContent.scheduled.map(([title, date]) => (
            <div key={title} className="flex gap-2.5 py-1">
              <ClockIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground">{date}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">Recent exports</h2>
          {reportsContent.exports.map(([title, meta]) => (
            <div key={title} className="flex gap-2.5 bg-background p-2.5">
              <CheckIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground">{meta}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function ReportsRoute() {
  const { sidebar } = reportsContent;

  return (
    <DashboardShell activeItem="Reports" operatorRole={sidebar.operatorRole} status={sidebar.status}>
      <ReportsHeader />
      <ReportFilters />
      <ReportMetrics />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[420px_minmax(0,1fr)_300px]">
        <ReportCatalog />
        <ReportPreview />
        <ReportsActivityRail />
      </div>
    </DashboardShell>
  );
}
