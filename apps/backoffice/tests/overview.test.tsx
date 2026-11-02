import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { OverviewPage } from "../src/features/backoffice/presentation/overview-page";
import { analyticsKey } from "../src/features/backoffice/application/analytics-api";
import { platformKeys } from "../src/features/backoffice/application/backoffice-api";
import LegacyAnalyticsPage from "../app/backoffice/analytics/page";
import { DistributionChart } from "@store-flow/ui";

function render(tab: string) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData([...analyticsKey, 1], {
    summary: { tenants: 7, activeTenants: 5, suspendedTenants: 2, branches: 12, activeBranches: 10, tenantsWithoutBranches: 1 },
    plans: { items: [{ id: "plan-1", name: "Varejo Pro", status: "PUBLISHED", priceCents: 9900, tenants: 5 }], total: 1, page: 1, perPage: 20, totalPages: 1 },
    controls: { maintenance: true, disabledKeys: ["inventory"] }, generatedAt: "2026-10-05T12:00:00Z",
  });
  client.setQueryData([...platformKeys.users, "count"], { count: 20 });
  client.setQueryData([...platformKeys.tenants, "recent"], { items: [{ id: "tenant-1", name: "Empresa recente", branchCount: 2, status: "ACTIVE", createdAt: "2026-10-05" }], total: 1 });
  const html = renderToStaticMarkup(<NuqsTestingAdapter searchParams={{ tab }}><QueryClientProvider client={client}><OverviewPage /></QueryClientProvider></NuqsTestingAdapter>);
  client.clear();
  return html;
}

test("overview consolidates indicators and companies without rendering inactive panels", () => {
  const html = render("companies");
  assert.match(html, /Empresa recente/);
  assert.match(html, /5 ativas/);
  assert.match(html, /10 ativas/);
  assert.match(html, /Distribuição das empresas: Ativas: 5, Suspensas: 2/);
  assert.match(html, /Distribuição das filiais: Ativas: 10, Inativas: 2/);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
  assert.equal((html.match(/<[^>]+>/g) ?? []).filter(tag => tag.includes('role="tabpanel"')).length, 1);
  assert.doesNotMatch(html, /Varejo Pro|Disponibilidade da plataforma/);
});
test("plans deep link shows server pagination and preserves global indicators", () => {
  const html = render("plans");
  assert.match(html, /Varejo Pro/);
  assert.match(html, /Página 1 de 1/);
  assert.match(html, /5 ativas/);
  assert.doesNotMatch(html, /Empresa recente|Disponibilidade da plataforma/);
});
test("platform tab shows maintenance and global controls", () => {
  const html = render("platform");
  assert.match(html, /Manutenção ativa/);
  assert.match(html, /platform-controls/);
  assert.doesNotMatch(html, /Varejo Pro|Empresa recente/);
});
test("invalid tab falls back to companies", () => {
  assert.match(render("invalid"), /Empresa recente/);
});
test("old analytics URL redirects to the consolidated plans tab", () => {
  assert.throws(() => LegacyAnalyticsPage(), error => error instanceof Error && "digest" in error && String(error.digest).includes("/backoffice?tab=plans"));
});
test("distribution chart handles empty data without invalid paths or percentages", () => {
  const html = renderToStaticMarkup(<DistributionChart title="Vazio" data={[{ label: "Ativas", value: 0, color: "var(--primary)" }]} />);
  assert.match(html, /Sem registros para exibir/);
  assert.doesNotMatch(html, /NaN|Infinity|<path/);
});
test("distribution chart keeps exact values accessible alongside the visual", () => {
  const html = renderToStaticMarkup(<DistributionChart title="Empresas" data={[{ label: "Ativas", value: 3, color: "var(--primary)" }, { label: "Suspensas", value: 1, color: "var(--destructive)" }]} />);
  assert.match(html, /Ativas: 3/);
  assert.match(html, /Suspensas: 1/);
  assert.match(html, /75%/);
  assert.match(html, /25%/);
  assert.equal((html.match(/<path/g) ?? []).length, 2);
});
