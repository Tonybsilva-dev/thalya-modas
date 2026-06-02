"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Button, Card, CardContent, Switch, cn } from "@thalya-modas/ui";
import { useLocale } from "next-intl";

import { normalizeLocale } from "@/src/shared/i18n/locales";
import { ThemeSwitcher } from "@/src/shared/ui/theme-switcher";
import { CheckIcon, PlusIcon } from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import {
  settingsContentByLocale,
  type SettingsSection,
} from "../domain/settings-content";

type SettingsRouteProps = {
  section: SettingsSection;
};

function useSettingsBasePath() {
  const params = useParams<{ role?: string }>();
  const role = params.role ?? "manager";

  return `/${role}/dashboard/settings`;
}

function useSettingsContent() {
  return settingsContentByLocale[normalizeLocale(useLocale())];
}

function SettingsHeader() {
  const { header } = useSettingsContent();

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
      <Button className="h-11 justify-center px-4">
        <PlusIcon className="size-4" />
        {header.actionLabel}
      </Button>
    </header>
  );
}

function SettingsTabs({ activeSection }: { activeSection: SettingsSection }) {
  const basePath = useSettingsBasePath();
  const content = useSettingsContent();

  return (
    <div className="flex gap-2 overflow-x-auto bg-muted p-1">
      {content.tabs.map(([value, label, segment]) => {
        const active = value === activeSection;
        const href = segment ? `${basePath}/${segment}` : basePath;

        return (
          <Button
            key={value}
            asChild
            className={cn("h-9 shrink-0 px-3", active && "bg-card")}
            variant={active ? "outline" : "ghost"}
          >
            <Link href={href}>{label}</Link>
          </Button>
        );
      })}
    </div>
  );
}

function SettingsPanel({ section }: { section: SettingsSection }) {
  const content = useSettingsContent().sections[section];

  return (
    <Card className="min-h-[520px]">
      <CardContent className="grid content-start gap-2 p-6">
        <div className="grid gap-1 pb-3">
          <h2 className="text-xl font-semibold text-foreground">{content.title}</h2>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </div>

        {section === "general" ? <ThemeSwitcher /> : null}

        {content.rows.map(([title, description, action]) => (
          <div
            key={title}
            className="flex items-center gap-4 border-b border-border py-3.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
            {action ? (
              <Button className="h-8 px-3" variant="outline">
                {action}
              </Button>
            ) : (
              <Switch defaultChecked aria-label={title} />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SettingsRail({ section }: { section: SettingsSection }) {
  const settings = useSettingsContent();
  const content = settings.sections[section];
  const labels =
    "labels" in settings
      ? settings.labels
      : {
          configurationHealth: "Configuration health",
          currentTab: "Current tab",
          routeState: "Route state",
          routeStateDescription:
            "Settings tabs are separate route states, preserving local workflow context per section.",
        };

  return (
    <aside className="grid gap-4 xl:w-[340px]">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-5">
          <p className="text-xs font-semibold">{labels.currentTab}</p>
          <h2 className="text-[26px] font-semibold leading-tight">{content.title}</h2>
          <p className="text-sm leading-6 text-white/80">{settings.handoff}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">
            {labels.configurationHealth}
          </h2>
          {settings.health.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 text-success-foreground" />
                <span className="text-xs font-medium text-foreground">{value}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 p-4">
          <h2 className="text-base font-semibold text-foreground">{labels.routeState}</h2>
          <Badge className="w-fit" variant="outline">
            {content.title}
          </Badge>
          <p className="text-xs leading-5 text-muted-foreground">
            {labels.routeStateDescription}
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}

export function SettingsRoute({ section }: SettingsRouteProps) {
  const { sidebar } = useSettingsContent();

  return (
    <DashboardShell
      operatorRole={sidebar.operatorRole}
      settingsActive
      status={sidebar.status}
    >
      <SettingsHeader />
      <SettingsTabs activeSection={section} />
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsPanel section={section} />
        <SettingsRail section={section} />
      </div>
    </DashboardShell>
  );
}
