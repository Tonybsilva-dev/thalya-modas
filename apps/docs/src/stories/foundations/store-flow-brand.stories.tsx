import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@store-flow/ui";
import { Badge, Button, Card, StatCard, FormActions, Input, CurrencyInput, Label, PageHeader, PageLayout, PageSection, PageToolbar, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@store-flow/ui";

const meta = { title: "Store Flow/Manual da marca", parameters: { layout: "fullscreen" }, tags: ["autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Identidade: Story = {
  render: () => <PageLayout className="bg-background p-5 text-foreground">
    <PageHeader title="Store Flow" description="Clareza para operar. Manual próprio de identidade e interface · versão 3.2." />
    <PageSection title="Paleta funcional" description="Azul sóbrio nas ações; superfícies neutras; estados com texto e cor.">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{["primary", "background", "card", "foreground", "muted", "border"].map(token => <div key={token} className="overflow-hidden border"><div aria-hidden="true" className="h-16 border-b" style={{ background: `var(--${token})` }} /><p className="p-2 text-xs">--{token}</p></div>)}</div>
      <div className="flex flex-wrap gap-2"><Badge variant="success">Disponível</Badge><Badge variant="warning">Requer atenção</Badge><Badge variant="destructive">Falha</Badge></div>
    </PageSection>
    <PageSection title="Princípios de operação"><ul className="grid gap-2 text-sm"><li>Uma tarefa principal por página.</li><li>Busca, filtros e ação antes da listagem.</li><li>Informação comprovável, sem métricas decorativas.</li><li>Filial na navegação; usuário e preferências no rodapé.</li><li>Desktop compacto, toque confortável, foco sempre visível.</li></ul></PageSection>
    <p className="text-xs text-muted-foreground">Consulta normativa: docs/brand-manual.md. Pesquisa e limites: docs/retail-reference-study.md.</p>
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
      {[['Produtos', '120', 'Produtos cadastrados'], ['Fornecedores', '18', 'Fornecedores da filial'], ['Pedidos de compra', '8', 'Pedidos registrados'], ['Vendas concluídas', '32', 'Pedidos de venda'], ['Valor vendido', 'R$ 8.450,00', 'Vendas concluídas, incluindo valores a prazo']].map(([label, value, hint]) => <StatCard key={label} label={label} value={value} hint={hint} />)}
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
