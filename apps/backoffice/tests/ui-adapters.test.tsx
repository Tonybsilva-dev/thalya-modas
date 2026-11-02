import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Switch, RadioGroup, RadioGroupItem, Textarea, IconButton, Tabs, TabsList, TabsTrigger, TabsContent, InputOTP } from "@store-flow/ui";
import { ListPagination } from "../src/features/backoffice/presentation/list-pagination";
import { Alert, AlertTitle, AlertDescription, Avatar, Breadcrumb, List, ListItem, ListItemMeta, SidebarItem } from "@store-flow/ui";
import { MaskedInput } from "../src/shared/ui/masked-input";
import { SupplierBreadcrumb } from "../src/features/dashboard/suppliers/presentation/supplier-breadcrumb";

test("published form controls preserve submitted names and initial values", () => {
  const html = renderToStaticMarkup(<form>
    <Switch name="notifications" defaultChecked aria-label="Avisos" />
    <RadioGroup name="status" defaultValue="active"><RadioGroupItem value="active" aria-label="Ativo" /><RadioGroupItem value="inactive" aria-label="Inativo" /></RadioGroup>
    <Textarea name="notes" defaultValue="Initial notes" />
  </form>);
  assert.match(html, /role="switch"/);
  assert.match(html, /name="notifications"/);
  assert.match(html, /name="notes"[^>]*>Initial notes<\/textarea>/);
  const radios = html.match(/<input[^>]+type="radio"[^>]*>/g) ?? [];
  assert.equal(radios.length, 2);
  assert.equal(radios.filter(tag => tag.includes('checked=""')).length, 1);
  assert.match(radios.find(tag => tag.includes('checked=""')) ?? "", /value="active"/);
});

test("controlled published tabs render only their selected panel", () => {
  const html = renderToStaticMarkup(<Tabs value="history"><TabsList aria-label="Empresa"><TabsTrigger value="account">Conta</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger></TabsList><TabsContent value="account">Hidden content</TabsContent><TabsContent value="history">Visible content</TabsContent></Tabs>);
  assert.match(html, /Visible content/);
  assert.doesNotMatch(html, /Hidden content/);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 1);
  assert.match(html, /aria-selected="true"/);
});

test("icon actions retain an accessible name and do not submit a form by default", () => {
  const html = renderToStaticMarkup(<IconButton aria-label="Adicionar"><svg aria-hidden="true" /></IconButton>);
  assert.match(html, /aria-label="Adicionar"/);
  assert.match(html, /type="button"/);
  assert.equal((html.match(/<button/g) ?? []).length, 1);
});

test("pagination uses real totals and Portuguese labels at the list boundary", () => {
  const html = renderToStaticMarkup(<ListPagination total={0} totalPages={0} page={1} onPageChange={() => {}} />);
  assert.match(html, /0 de 0/);
  assert.match(html, /Página 1 de 1/);
  assert.match(html, /Anterior/);
  assert.match(html, /Próxima/);
  assert.equal((html.match(/<button[^>]*disabled=""/g) ?? []).length, 2);
});

test("list pagination blocks both directions while the current request is pending", () => {
  const html = renderToStaticMarkup(<ListPagination total={100} totalPages={5} page={2} disabled onPageChange={() => {}} />);
  assert.match(html, /Página 2 de 5/);
  assert.equal((html.match(/<button[^>]*disabled=""/g) ?? []).length, 2);
});

test("OTP renders six real editable inputs instead of disconnected visual slots", () => {
  const html = renderToStaticMarkup(<InputOTP maxLength={6} defaultValue="123456" />);
  assert.equal((html.match(/<input/g) ?? []).length, 6);
  assert.match(html, /value="1"/);
  assert.match(html, /value="6"/);
});

test("published breadcrumb preserves real supplier links and the current location", () => {
  const html = renderToStaticMarkup(<SupplierBreadcrumb basePath="/manager/dashboard/suppliers?search=Acme" rootLabel="Fornecedores" currentLabel="Editar fornecedor" />);
  assert.match(html, /href="\/manager\/dashboard\/suppliers\?search=Acme"/);
  assert.match(html, /aria-current="page"[^>]*>Editar fornecedor/);
  assert.match(html, /aria-label="Navegação de fornecedores"/);
  assert.doesNotMatch(html, /role="button"/);
});

test("a single breadcrumb does not create an unnecessary navigation region", () => {
  assert.equal(renderToStaticMarkup(<Breadcrumb items={[{ label: "Estoque" }]} />), "");
});

test("list metadata remains inside semantic list items after the API migration", () => {
  const html = renderToStaticMarkup(<List><ListItem><ListItemMeta title="Fornecedor" description="Ativo" /></ListItem></List>);
  assert.match(html, /<ul\b/);
  assert.match(html, /<li\b/);
  assert.match(html, /Fornecedor/);
  assert.match(html, /Ativo/);
});

test("banner-backed alerts preserve status announcements and their original message", () => {
  const html = renderToStaticMarkup(<Alert variant="success" role="status"><svg aria-hidden="true" /><div><AlertTitle>Alterações salvas</AlertTitle><AlertDescription>Cadastro atualizado.</AlertDescription></div></Alert>);
  assert.match(html, /data-slot="banner"/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(html, /Alterações salvas/);
  assert.match(html, /Cadastro atualizado/);
});

test("published masked fields retain form names and the displayed formatted value", () => {
  const html = renderToStaticMarkup(<MaskedInput id="cep" name="postalCode" mask="00000-000" value="12345-678" onValueChange={() => {}} />);
  assert.match(html, /id="cep"/);
  assert.match(html, /name="postalCode"/);
  assert.match(html, /value="12345-678"/);
  assert.doesNotMatch(html, /type="hidden"/);
});

test("sidebar buttons default to non-submitting controls and avatars keep initials", () => {
  const html = renderToStaticMarkup(<form><SidebarItem>Estoque</SidebarItem><Avatar initials="SF" aria-label="Store Flow" /></form>);
  assert.match(html, /type="button"/);
  assert.match(html, /aria-label="Store Flow"/);
  assert.match(html, />SF<\/span>/);
});
