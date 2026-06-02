import type {
	DashboardCashRegister,
	DashboardCustomers,
	DashboardInventory,
	DashboardOrders,
	DashboardOverview,
	DashboardReports,
	DashboardSuppliers,
} from '../../../domain/entities/dashboard';
import type { DashboardRepository } from '../../../domain/repositories/dashboard-repository';

export class InMemoryDashboardRepository implements DashboardRepository {
	async getOverview(_userId: string): Promise<DashboardOverview> {
		return clone(overview);
	}

	async getOrders(_userId: string): Promise<DashboardOrders> {
		return clone(orders);
	}

	async getInventory(_userId: string): Promise<DashboardInventory> {
		return clone(inventory);
	}

	async getCustomers(_userId: string): Promise<DashboardCustomers> {
		return clone(customers);
	}

	async getCashRegister(_userId: string): Promise<DashboardCashRegister> {
		return clone(cashRegister);
	}

	async getSuppliers(_userId: string): Promise<DashboardSuppliers> {
		return clone(suppliers);
	}

	async getReports(_userId: string): Promise<DashboardReports> {
		return clone(reports);
	}
}

const overview: DashboardOverview = {
	store: {
		name: 'Store Flow',
		status: 'Aberta ate 19:00',
		operatorName: 'Ana Ribeiro',
		operatorRole: 'Gerente em turno',
	},
	header: {
		title: 'Centro de comando da loja',
		description:
			'Acompanhe vendas, risco de estoque, retiradas e fechamento de caixa em um so lugar.',
	},
	metrics: [
		{
			label: 'Vendas de hoje',
			value: 'R$ 4.820',
			description: '+18% vs seg.',
			tone: 'success',
		},
		{
			label: 'Pedidos abertos',
			value: '26',
			description: '8 aguardando retirada',
			tone: 'info',
		},
		{
			label: 'SKUs com baixo estoque',
			value: '14',
			description: '5 tamanhos criticos',
			tone: 'warning',
		},
		{
			label: 'Caixa previsto',
			value: 'R$ 7.310',
			description: 'Fechar as 19:10',
			tone: 'muted',
		},
	],
	salesPulse: {
		title: 'Pulso de vendas',
		description: 'Receita por hora do POS e retirada online',
		status: 'AO VIVO',
		hours: ['09', '10', '11', '12', '13', '14', '15', '16', '17'],
		values: [32, 48, 42, 61, 72, 54, 76, 89, 66],
	},
	spotlight: {
		eyebrow: 'Item principal',
		name: 'Vestido midi canelado',
		description: '18 vendidos hoje - 6 unidades restantes em M e G',
	},
	inventoryRisk: {
		title: 'Risco de estoque',
		description: 'Priorize reposicao antes do pico de demanda da tarde.',
		rows: [
			{
				product: 'Calca pantalona alfaiataria',
				sku: 'CL-4821',
				stock: '3 / 24',
				demand: 'Alta',
				action: 'Repor',
			},
			{
				product: 'Blusa viscose manga curta',
				sku: 'BL-1930',
				stock: '5 / 40',
				demand: 'Alta',
				action: 'Transferir',
			},
			{
				product: 'Vestido midi canelado',
				sku: 'VD-7712',
				stock: '6 / 30',
				demand: 'Pico',
				action: 'Repor',
			},
		],
	},
	actionRail: [
		{
			title: 'Fila de retirada',
			value: '8 pedidos prontos',
			description: 'Avisar clientes aguardando ha mais de 2h',
			tone: 'info',
		},
		{
			title: 'Fechamento de caixa',
			value: 'Diferenca de R$ 490 no cartao',
			description: 'Verificar lote Stone 0047',
			tone: 'warning',
		},
	],
	checklist: [
		{ task: 'Confirmar entrega do fornecedor', time: '10:30' },
		{ task: 'Publicar story de novidades', time: '12:00' },
		{ task: 'Fechar caixa e exportar relatorio', time: '19:10' },
	],
};

const orders: DashboardOrders = {
	summary: [
		{ label: 'Abertos', value: '26', description: '8 retiradas', tone: 'info' },
		{ label: 'Faturados', value: '74', description: 'Hoje', tone: 'success' },
		{ label: 'Atrasados', value: '3', description: 'Exigem acao', tone: 'warning' },
	],
	queues: [
		{ status: 'Novo', count: 9, description: 'Separar produtos' },
		{ status: 'Pronto', count: 8, description: 'Aguardando retirada' },
		{ status: 'Entregue', count: 58, description: 'Finalizados hoje' },
	],
	orders: [
		{
			id: '#1842',
			customer: 'Marina Costa',
			status: 'Aberto',
			total: 'R$ 448',
			channel: 'Loja',
		},
		{
			id: '#1841',
			customer: 'Paula Neves',
			status: 'Pronto',
			total: 'R$ 219',
			channel: 'Online',
		},
	],
};

const inventory: DashboardInventory = {
	summary: [
		{ label: 'SKUs ativos', value: '1.284', description: '+32 novos', tone: 'info' },
		{ label: 'Baixo estoque', value: '14', description: '5 criticos', tone: 'warning' },
		{ label: 'Cobertura', value: '18d', description: 'Media geral', tone: 'success' },
	],
	products: [
		{
			product: 'Vestido midi canelado',
			sku: 'VD-7712',
			stock: 6,
			minimum: 30,
			status: 'Critico',
		},
		{
			product: 'Sandalia tiras nude',
			sku: 'SN-0174',
			stock: 4,
			minimum: 18,
			status: 'Baixo',
		},
	],
	movements: [
		{ date: '2026-06-02', type: 'Entrada', sku: 'BL-1930', quantity: 40 },
		{ date: '2026-06-02', type: 'Saida', sku: 'VD-7712', quantity: 18 },
	],
};

const customers: DashboardCustomers = {
	summary: [
		{ label: 'Clientes ativos', value: '942', description: '+21 mes', tone: 'info' },
		{ label: 'VIP', value: '86', description: 'Alta recorrencia', tone: 'success' },
		{ label: 'Promissorias', value: 'R$ 3.420', description: 'Em aberto', tone: 'warning' },
	],
	customers: [
		{
			id: 'customer-marina-costa',
			name: 'Marina Costa',
			status: 'VIP',
			lastPurchase: '2026-06-02',
			totalSpent: 'R$ 4.820',
		},
		{
			id: 'customer-paula-neves',
			name: 'Paula Neves',
			status: 'Ativa',
			lastPurchase: '2026-06-01',
			totalSpent: 'R$ 1.980',
		},
	],
	segments: [
		{ name: 'VIP', count: 86, revenue: 'R$ 42.900' },
		{ name: 'Recorrentes', count: 304, revenue: 'R$ 96.100' },
	],
};

const cashRegister: DashboardCashRegister = {
	summary: [
		{ label: 'Caixa previsto', value: 'R$ 7.310', description: 'Hoje', tone: 'success' },
		{ label: 'Diferenca', value: 'R$ 490', description: 'Cartao', tone: 'warning' },
		{ label: 'Vendas abertas', value: '1', description: 'Recibo #1842', tone: 'info' },
	],
	paymentMethods: [
		{ method: 'Cartao de credito', amount: 'R$ 320', status: 'Selecionado' },
		{ method: 'Pix', amount: 'R$ 137', status: 'Disponivel' },
		{ method: 'Dinheiro', amount: 'R$ 0', status: 'Disponivel' },
	],
	currentSale: [
		{ item: 'Vestido midi canelado - M / Preto', quantity: 1, price: 'R$ 219', total: 'R$ 219' },
		{ item: 'Sandalia tiras nude - 36', quantity: 1, price: 'R$ 189', total: 'R$ 189' },
	],
	closingTasks: [
		{ task: 'Conferir lote Stone 0047', status: 'Pendente' },
		{ task: 'Exportar relatorio', status: 'Pendente' },
	],
};

const suppliers: DashboardSuppliers = {
	summary: [
		{ label: 'Fornecedores ativos', value: '38', description: '6 prioritarios', tone: 'info' },
		{ label: 'Recebimentos', value: '7', description: 'Hoje', tone: 'success' },
		{ label: 'Atrasos', value: '2', description: 'Acionar compras', tone: 'warning' },
	],
	suppliers: [
		{
			id: 'supplier-moda-bella',
			name: 'Moda Bella Distribuidora',
			status: 'Ativo',
			nextDelivery: '2026-06-03',
		},
		{
			id: 'supplier-urban-fit',
			name: 'Urban Fit Atacado',
			status: 'Atrasado',
			nextDelivery: '2026-06-04',
		},
	],
	receivings: [
		{ invoice: 'NF-8842', supplier: 'Moda Bella Distribuidora', items: 42, status: 'Conferir' },
		{ invoice: 'NF-8843', supplier: 'Urban Fit Atacado', items: 18, status: 'Atrasado' },
	],
};

const reports: DashboardReports = {
	summary: [
		{ label: 'Receita', value: 'R$ 148.200', description: 'Mes atual', tone: 'success' },
		{ label: 'Ticket medio', value: 'R$ 187', description: '+8%', tone: 'info' },
		{ label: 'Margem', value: '42%', description: 'Operacional', tone: 'muted' },
	],
	reports: [
		{ id: 'sales', name: 'Vendas por periodo', status: 'Disponivel' },
		{ id: 'inventory', name: 'Giro de estoque', status: 'Disponivel' },
		{ id: 'cash', name: 'Fechamento financeiro', status: 'Disponivel' },
	],
	series: [
		{ name: 'Vendas', values: [28, 36, 32, 48, 54, 61] },
		{ name: 'Meta', values: [30, 34, 38, 42, 48, 56] },
	],
	periods: ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.'],
};

function clone<T>(value: T): T {
	return structuredClone(value);
}
