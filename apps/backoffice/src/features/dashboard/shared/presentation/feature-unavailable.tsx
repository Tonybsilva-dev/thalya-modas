import { ClockCounterClockwise } from "@phosphor-icons/react";
import { Badge, PageSection } from "@store-flow/ui";
import type { ReactNode } from "react";

export function FeatureUnavailable({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <PageSection title={<span className="flex items-center gap-2"><ClockCounterClockwise aria-hidden="true" className="size-5 text-muted-foreground" />{title}</span>}>
    <Badge variant="outline" className="w-fit">Ainda não disponível</Badge>
    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    {action && <div className="flex flex-wrap gap-2">{action}</div>}
  </PageSection>;
}
