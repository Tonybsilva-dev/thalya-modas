"use client";

import { Badge, Button, Card, CardContent } from "@thalya-modas/ui";
import { useLocale } from "next-intl";

import { normalizeLocale } from "@/src/shared/i18n/locales";

import {
  BriefcaseIcon,
  CalendarIcon,
  MailIcon,
  ShieldCheckIcon,
} from "../../overview/presentation/dashboard-icons";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import { aboutContentByLocale } from "../domain/about-content";

const supportIcons = {
  briefcase: BriefcaseIcon,
  calendar: CalendarIcon,
  mail: MailIcon,
  shield: ShieldCheckIcon,
};

function useAboutContent() {
  return aboutContentByLocale[normalizeLocale(useLocale())];
}

function AboutHeader() {
  const { header } = useAboutContent();

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="grid gap-1.5">
        <h1 className="text-[32px] font-bold leading-tight text-foreground">
          {header.title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {header.description}
        </p>
      </div>
      <Button className="h-10 w-fit px-4" variant="outline">
        <MailIcon className="size-4" />
        {header.actionLabel}
      </Button>
    </header>
  );
}

function AgencySummary() {
  const content = useAboutContent();
  const { agency } = content;

  return (
    <section className="grid gap-4">
      <Card className="shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <CardContent className="grid gap-[18px] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid size-16 shrink-0 place-items-center bg-secondary text-lg font-bold text-secondary-foreground">
              {agency.initials}
            </div>
            <div className="grid min-w-0 gap-1">
              <h2 className="text-xl font-bold leading-tight text-foreground">
                {agency.name}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {agency.description}
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-foreground">{agency.summary}</p>
          <div className="flex flex-wrap gap-2.5">
            {agency.badges.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {content.facts.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="grid gap-1 p-4">
              <span className="text-xs text-muted-foreground">{label}</span>
              <strong className="text-sm font-semibold text-foreground">{value}</strong>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ScopeCard() {
  const content = useAboutContent();
  const labels = "labels" in content ? content.labels : { scope: "Escopo do sistema" };

  return (
    <section className="grid content-start gap-2.5">
      <h2 className="text-lg font-bold text-foreground">{labels.scope}</h2>
      {content.scope.map(([title, description]) => (
        <Card key={title}>
          <CardContent className="flex min-h-24 gap-2.5 p-3.5">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            <div className="grid gap-1">
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function SupportCard() {
  const content = useAboutContent();
  const labels = "labels" in content ? content.labels : { support: "Contato e manutenção" };

  return (
    <section className="grid content-start gap-2.5">
      <h2 className="text-lg font-bold text-foreground">{labels.support}</h2>
      {content.support.map(([title, description, icon]) => {
        const Icon = supportIcons[icon];

        return (
          <Card key={title}>
            <CardContent className="flex min-h-24 items-center gap-2.5 px-3.5 py-3">
              <Icon className="size-[18px] shrink-0 text-foreground" />
              <div className="grid min-w-0 gap-0.5">
                <h3 className="text-[13px] font-bold text-foreground">{title}</h3>
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function AboutFooterNote() {
  const { footer } = useAboutContent();

  return (
    <footer className="flex flex-col gap-2 border-t border-border pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">{footer.note}</p>
      <p className="font-semibold text-foreground">{footer.copyright}</p>
    </footer>
  );
}

export function AboutRoute() {
  const { sidebar } = useAboutContent();

  return (
    <DashboardShell
      activeItem="About"
      operatorRole={sidebar.operatorRole}
      status={sidebar.status}
    >
      <AboutHeader />
      <AgencySummary />
      <div className="grid min-h-0 gap-5 xl:grid-cols-2">
        <ScopeCard />
        <SupportCard />
      </div>
      <AboutFooterNote />
    </DashboardShell>
  );
}
