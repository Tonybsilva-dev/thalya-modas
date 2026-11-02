import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Package, Users, Truck } from "lucide-react";
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@store-flow/ui";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem, Pagination } from "@store-flow/ui";
import { Badge, Button, Card, StatCard, FormActions, Input, CurrencyInput, Label, PageHeader, PageLayout, PageSection, PageToolbar, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea, Switch, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@store-flow/ui";

const meta = { title: "Store Flow/Manual da marca", parameters: { layout: "fullscreen" }, tags: ["autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Identidade: Story = {
  render: () => <PageLayout className="bg-background p-5 text-foreground">
    <PageHeader title="Store Flow" description="Clareza para operar. Gestão de loja com superfícies suaves e navegação compacta · versão 5.0.0." />
    <PageSection title="Paleta funcional" description="Azul nas ações, indicadores em tons suaves e estados com texto e cor.">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{["primary", "background", "card", "foreground", "muted", "border"].map(token => <div key={token} className="overflow-hidden border"><div aria-hidden="true" className="h-16 border-b" style={{ background: `var(--${token})` }} /><p className="p-2 text-xs">--{token}</p></div>)}</div>
      <div className="flex flex-wrap gap-2"><Badge variant="success">Disponível</Badge><Badge variant="warning">Requer atenção</Badge><Badge variant="destructive">Falha</Badge></div>
    </PageSection>
    <PageSection title="Princípios de operação"><ul className="grid gap-2 text-sm"><li>Uma tarefa principal por página.</li><li>Busca, filtros e ação antes da listagem.</li><li>Informação comprovável, sem métricas decorativas.</li><li>Filial na navegação; usuário e preferências no rodapé.</li><li>Desktop compacto, toque confortável, foco sempre visível.</li></ul></PageSection>
    <p className="text-xs text-muted-foreground">Consulta normativa: docs/brand-manual.md. Pranchas preservadas: docs/design-references/retail-dashboard-2026-10-28/gallery.html. Hellix é a referência; Inter é o fallback disponível.</p>
  </PageLayout>,
};

export const Listagem: Story = {
  render: () => <PageLayout className="bg-background p-5 text-foreground">
    <PageHeader title="Clientes" description="Cadastro comercial da filial." primaryAction={<Button>Novo cliente</Button>} />
    <p className="text-xs text-muted-foreground">Exemplo visual com dados ilustrativos. Não representa registros da aplicação.</p>
    <Card><PageToolbar><div className="grid w-full gap-1.5 sm:max-w-sm"><Label htmlFor="brand-customer-search">Buscar cliente</Label><Input id="brand-customer-search" placeholder="Nome, telefone ou documento" /></div><Button variant="outline">Filtros</Button></PageToolbar>
      <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Telefone</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{["Cliente de exemplo A", "Cliente de exemplo B", "Cliente de exemplo C"].map(name => <TableRow key={name}><TableCell className="font-medium">{name}</TableCell><TableCell>Não informado</TableCell><TableCell><Badge variant="outline">Ativo</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="ghost">Editar<span className="sr-only"> {name}</span></Button></TableCell></TableRow>)}</TableBody></Table>
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>3 registros ilustrativos</span><span>Página 1 de 1</span></div>
    </Card>
  </PageLayout>,
};

export const Cadastro: Story = {
  render: () => <PageLayout className="bg-background p-5 text-foreground">
    <PageHeader title="Cadastrar produto" description="Identificação, preços e controle de estoque." actions={<Button variant="outline">Voltar ao estoque</Button>} />
    <p className="text-xs text-muted-foreground">Exemplo visual; estes campos não gravam dados.</p>
    <div className="grid content-start gap-3"><PageSection title="Identificação" description="Os dados necessários para encontrar e vender o produto."><div className="grid gap-4 sm:grid-cols-2">{[["name", "Nome do produto"], ["barcode", "Código de barras"], ["cost", "Custo de referência"], ["price", "Preço de venda"]].map(([name, label]) => <div key={name} className="grid gap-1.5"><Label htmlFor={`brand-${name}`}>{label}</Label>{name === "cost" || name === "price" ? <CurrencyInput id={`brand-${name}`} aria-label={`${label} em reais`} placeholder="0,00" /> : <Input id={`brand-${name}`} />}</div>)}</div></PageSection><PageSection title="Estoque"><Badge variant="outline">Sem controle de saldo</Badge><p className="text-sm text-muted-foreground">O produto avulso continua no catálogo, sem exigir fornecedor.</p></PageSection></div>
    <FormActions><Button variant="outline">Cancelar</Button><Button>Salvar produto</Button></FormActions>
  </PageLayout>,
};


export const VisaoGeral: Story = {
  render: () => <PageLayout className="bg-background p-5 text-foreground">
    <PageHeader title="Visão geral" description="Vendas, catálogo e reposição da filial." actions={<Button variant="outline">Atualizar</Button>} primaryAction={<Button>Pedidos de venda</Button>} />
    <p className="text-xs text-muted-foreground">Exemplo visual com dados ilustrativos.</p>
    <section aria-label="Indicadores da filial" className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {[['Produtos', '120', 'Produtos cadastrados'], ['Fornecedores', '18', 'Fornecedores da filial'], ['Pedidos de compra', '8', 'Pedidos registrados'], ['Vendas concluídas', '32', 'Pedidos de venda'], ['Valor vendido', 'R$ 8.450,00', 'Vendas concluídas, incluindo valores a prazo']].map(([label, value, hint], index) => <StatCard key={label} tone={(["brand", "mint", "rose", "amber", "sky"] as const)[index]} label={label} value={value} hint={hint} />)}
    </section>
    <Card><div className="border-b px-4 py-3"><h2 className="text-base font-semibold">Reposição de estoque</h2></div><p className="p-4 text-sm text-muted-foreground">Nenhum produto abaixo do estoque mínimo.</p></Card>
  </PageLayout>,
};


function SupplierSheetExample() {
  const [open, setOpen] = useState(false);
  return <PageLayout className="bg-background p-5 text-foreground">
    <Sheet open={open} onOpenChange={setOpen}>
      <PageHeader title="Fornecedores" description="Exemplo visual sem persistência de dados." primaryAction={<SheetTrigger asChild><Button>Novo fornecedor</Button></SheetTrigger>} />
      <Card><Table><TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead>Situação</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Fornecedor ilustrativo</TableCell><TableCell>Ativo</TableCell><TableCell><SheetTrigger asChild><Button variant="ghost">Editar</Button></SheetTrigger></TableCell></TableRow></TableBody></Table></Card>
      <SheetContent><SheetHeader><SheetTitle className="[font-family:var(--font-primary)]">Cadastrar fornecedor</SheetTitle><SheetDescription>A listagem permanece no contexto. Campos ilustrativos.</SheetDescription></SheetHeader><SheetBody><PageSection title="Identificação"><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label htmlFor="sheet-demo-name">Nome do fornecedor</Label><Input id="sheet-demo-name" /></div><div className="grid gap-1.5"><Label htmlFor="sheet-demo-document">Documento</Label><Input id="sheet-demo-document" /></div></div></PageSection><PageSection title="Condições comerciais"><div className="grid gap-1.5"><Label htmlFor="sheet-demo-minimum">Pedido mínimo (R$)</Label><CurrencyInput id="sheet-demo-minimum" /></div></PageSection></SheetBody><SheetFooter><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={() => setOpen(false)}>Fechar exemplo</Button></SheetFooter></SheetContent>
    </Sheet>
  </PageLayout>;
}
export const CadastroLateral: Story = { render: () => <SupplierSheetExample /> };

function MigratedControlsExample() {
  const [status, setStatus] = useState("active");
  const [enabled, setEnabled] = useState(true);
  return <PageLayout className="bg-background p-5 text-foreground">
    <PageHeader title="Componentes TrinketOS" description="Contratos adaptados ao Store Flow. Dados ilustrativos, sem gravação." />
    <p className="text-sm text-muted-foreground">Use o seletor de tema do Storybook para comparar campos e portais. Referências técnicas usam <code className="font-mono">SF-EXEMPLO-001</code>; valores financeiros usam números tabulares.</p>
    <Tabs defaultValue="fields">
      <TabsList aria-label="Exemplos de migração"><TabsTrigger value="fields">Campos</TabsTrigger><TabsTrigger value="feedback">Feedback</TabsTrigger></TabsList>
      <TabsContent value="fields">
        <PageSection title="Cadastro ilustrativo">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="migration-name">Nome</Label><Input id="migration-name" placeholder="Nome do fornecedor" /></div>
            <div className="grid gap-1.5"><Label htmlFor="migration-status">Situação</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="migration-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select></div>
            <div className="grid gap-1.5"><Label htmlFor="migration-money">Pedido mínimo (R$)</Label><CurrencyInput id="migration-money" /></div>
            <div className="flex items-center gap-3"><Switch id="migration-enabled" checked={enabled} onCheckedChange={setEnabled} /><Label htmlFor="migration-enabled">Receber avisos</Label></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="migration-notes">Observações</Label><Textarea id="migration-notes" placeholder="Informações adicionais" /></div>
        </PageSection>
      </TabsContent>
      <TabsContent value="feedback"><PageSection title="Estados explícitos"><div className="flex flex-wrap gap-2"><Badge variant="success">Salvo</Badge><Badge variant="warning">Verificação pendente</Badge><Badge variant="error">Falha ao salvar</Badge></div><p className="text-sm text-muted-foreground">Estados ilustrativos. Nenhuma operação foi executada.</p></PageSection></TabsContent>
    </Tabs>
    <Dialog><DialogTrigger asChild><Button variant="outline">Abrir confirmação ilustrativa</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Conferir cadastro</DialogTitle><DialogDescription>Teste Tab, Shift+Tab e Escape. O foco deve retornar ao gatilho.</DialogDescription></DialogHeader><p className="text-sm">Este exemplo permite revisar a apresentação do diálogo sem alterar dados.</p><DialogFooter><Button variant="outline" disabled>Salvar indisponível no exemplo</Button></DialogFooter></DialogContent></Dialog>
  </PageLayout>;
}
export const ComponentesMigrados: Story = { render: () => <MigratedControlsExample /> };

const exampleProducts = [
  { code: "EX-001", name: "Cabo USB-C", category: "Acessórios", stock: 42, price: 29.9, active: true },
  { code: "EX-002", name: "Mouse sem fio", category: "Informática", stock: 18, price: 79.9, active: true },
  { code: "EX-003", name: "Teclado compacto", category: "Informática", stock: 12, price: 129.9, active: true },
  { code: "EX-004", name: "Carregador de parede", category: "Acessórios", stock: 24, price: 59.9, active: true },
  { code: "EX-005", name: "Adaptador HDMI", category: "Acessórios", stock: 0, price: 39.9, active: false },
  { code: "EX-006", name: "Suporte de mesa", category: "Escritório", stock: 8, price: 49.9, active: true },
];

function StoreManagementExample() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const records = exampleProducts.filter(product => `${product.code} ${product.name}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && (status === "all" || product.active === (status === "active")));
  return <div className="flex bg-background text-foreground">
    <Sidebar className="hidden h-auto shrink-0 lg:flex">
      <SidebarHeader className="items-center"><span aria-label="Store Flow" className="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">SF</span></SidebarHeader>
      <SidebarContent className="grid justify-items-center content-start gap-3"><SidebarItem active className="size-12 justify-center p-0" aria-label="Produtos" title="Produtos"><Package aria-hidden="true" /></SidebarItem><SidebarItem disabled className="size-12 justify-center p-0" aria-label="Clientes" title="Clientes"><Users aria-hidden="true" /></SidebarItem><SidebarItem disabled className="size-12 justify-center p-0" aria-label="Fornecedores" title="Fornecedores"><Truck aria-hidden="true" /></SidebarItem></SidebarContent>
      <SidebarFooter className="items-center"><span title="Operador de exemplo" className="flex size-10 items-center justify-center rounded-full bg-muted text-xs">OP</span></SidebarFooter>
    </Sidebar>
    <div className="min-w-0 flex-1">
      <div className="flex min-h-[var(--sf-header-height)] flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-2 text-sm"><span>Loja ilustrativa / Filial Centro</span><Badge variant="outline">Dados ilustrativos</Badge></div>
      <PageLayout className="p-[var(--sf-page-gutter)]">
        <PageHeader title="Produtos" description="Catálogo e posição de estoque da filial." primaryAction={<Button onClick={() => setOpen(true)}>Novo produto</Button>} />
        <Card className="overflow-hidden">
          <PageToolbar>
            <div className="grid w-full gap-1.5 sm:max-w-sm"><Label htmlFor="operational-search">Buscar produto</Label><Input id="operational-search" value={search} placeholder="Nome ou código" onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
            <div className="grid w-full gap-1.5 sm:w-44"><Label htmlFor="operational-status">Situação</Label><Select value={status} onValueChange={value => { setStatus(value); setPage(1); }}><SelectTrigger id="operational-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="inactive">Inativos</SelectItem></SelectContent></Select></div>
            {(search || status !== "all") && <Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); setPage(1); }}>Limpar filtros</Button>}
          </PageToolbar>
          <p className="border-b px-4 py-2 text-xs text-muted-foreground" role="status">{records.length} produtos encontrados</p>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Estoque</TableHead><TableHead className="text-right">Preço de venda</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader><TableBody>{records.slice((page - 1) * 5, page * 5).map(product => <TableRow key={product.code}><TableCell className="whitespace-nowrap font-mono text-xs">{product.code}</TableCell><TableCell className="min-w-44 font-medium">{product.name}</TableCell><TableCell>{product.category}</TableCell><TableCell className="text-right">{product.stock}</TableCell><TableCell className="whitespace-nowrap text-right">{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell><TableCell><Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Ativo" : "Inativo"}</Badge></TableCell></TableRow>)}{records.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Nenhum produto corresponde aos filtros.</TableCell></TableRow>}</TableBody></Table></div>
          <Pagination className="border-t px-4 py-2" page={page} pageSize={5} total={records.length} onPageChange={setPage} showSizeChanger={false}><Pagination.Info /><div className="flex gap-2"><Pagination.Prev labelPrev="Anterior" /><Pagination.Next labelNext="Próxima" /></div></Pagination>
        </Card>
        <p className="text-xs text-muted-foreground">Referência de layout com dados ilustrativos. Busca e filtros são locais; o formulário não grava cadastros.</p>
      </PageLayout>
    </div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle className="[font-family:var(--font-primary)]">Cadastrar produto</SheetTitle><SheetDescription>Exemplo de organização do cadastro, sem persistência.</SheetDescription></SheetHeader><SheetBody><PageSection title="Identificação"><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label htmlFor="operational-name">Nome do produto</Label><Input id="operational-name" /></div><div className="grid gap-1.5"><Label htmlFor="operational-code">Código interno</Label><Input id="operational-code" /></div></div></PageSection><PageSection title="Preços"><div className="grid gap-1.5"><Label htmlFor="operational-price">Preço de venda (R$)</Label><CurrencyInput id="operational-price" /></div></PageSection></SheetBody><SheetFooter><SheetClose asChild><Button variant="outline">Fechar exemplo</Button></SheetClose></SheetFooter></SheetContent></Sheet>
  </div>;
}
export const GerenciamentoDeLoja: Story = { render: () => <StoreManagementExample /> };
