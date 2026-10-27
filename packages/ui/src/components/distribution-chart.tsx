"use client";

import * as React from "react";
import { Group } from "@visx/group";
import { Pie } from "@visx/shape";

export type DistributionSlice = { label: string; value: number; color: string };

/** Visx distribution chart with a textual legend for every value. */
export function DistributionChart({ title, data }: { title: string; data: DistributionSlice[] }) {
  const id = React.useId();
  const slices = data.filter(slice => slice.value > 0);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return <figure className="space-y-4" aria-labelledby={id}>
    <figcaption id={id} className="font-semibold">{title}</figcaption>
    {total === 0 ? <p className="py-8 text-sm text-muted-foreground">Sem registros para exibir.</p> : <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" className="size-44 max-w-full shrink-0" role="img" aria-label={`${title}: ${data.map(slice => `${slice.label}: ${Math.max(0, slice.value)}`).join(', ')}`}>
        <Group top={100} left={100}><Pie<DistributionSlice> data={slices} pieValue={slice => slice.value} outerRadius={94} innerRadius={66} padAngle={0.025}>
          {pie => pie.arcs.map(arc => <path key={arc.data.label} d={pie.path(arc) ?? undefined} fill={arc.data.color}><title>{`${arc.data.label}: ${arc.data.value} (${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(arc.data.value / total * 100)}%)`}</title></path>)}
        </Pie><text textAnchor="middle" dy="0.35em" className="fill-foreground text-2xl font-semibold">{total}</text></Group>
      </svg>
      <ul className="min-w-0 flex-1 space-y-3 text-sm">{data.map(slice => <li key={slice.label} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><span className="size-3 shrink-0" style={{ backgroundColor: slice.color }} aria-hidden="true" />{slice.label}</span><span className="tabular-nums">{Math.max(0, slice.value)} · {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Math.max(0, slice.value) / total * 100)}%</span></li>)}</ul>
    </div>}
  </figure>;
}
