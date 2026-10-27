import type { Prisma, PrismaClient } from '@prisma/client';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import { SalesService } from '../../../application/sales';
import type {
	DashboardCashRegister,
	DashboardCustomerDetail,
	DashboardCustomerPromissory,
	DashboardCustomers,
	DashboardInventory,
	DashboardListQuery,
	DashboardMetric,
	DashboardOrders,
	DashboardOverview,
	DashboardReports,
	DashboardSuppliers,
} from '../../../domain/entities/dashboard';
import type { DashboardRepository } from '../../../domain/repositories/dashboard-repository';

const metric = (
	label: string,
	value: number,
	description: string,
): DashboardMetric => ({
	label,
	value: String(value),
	description,
	tone: 'info',
});
export class PrismaDashboardRepository implements DashboardRepository {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly storeId?: string,
	) {}
	withStore(storeId: string) {
		return new PrismaDashboardRepository(this.prisma, storeId);
	}
	private scope() {
		if (!this.storeId) throw new DomainError('Selecione uma filial.');
		return { storeId: this.storeId };
	}
	async getOverview(userId: string): Promise<DashboardOverview> {
		const scope = this.scope();
		const [store, user, products, suppliers, purchases, risk] =
			await Promise.all([
				this.prisma.store.findUniqueOrThrow({ where: { id: scope.storeId } }),
				this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
				this.prisma.product.count({ where: scope }),
				this.prisma.supplier.count({ where: scope }),
				this.prisma.purchaseOrder.count({ where: scope }),
				this.prisma.product.findMany({
					where: {
						...scope,
						inventoryControl: 'tracked',
						status: 'active',
						currentStock: { lte: this.prisma.product.fields.minimumStock },
					},
					take: 10,
					orderBy: [{ currentStock: 'asc' }, { id: 'asc' }],
				}),
			]);
		const sales = await this.prisma.saleOrder.aggregate({
			where: { ...scope, status: 'COMPLETED' },
			_count: true,
			_sum: { totalCents: true },
		});
		return {
			store: {
				name: store.name,
				status: store.status,
				operatorName: user.name,
				operatorRole: user.role,
			},
			header: {
				title: store.name,
				description: 'Indicadores reais de estoque e compras da filial ativa.',
			},
			metrics: [
				metric('Produtos', products, 'Produtos cadastrados'),
				metric('Fornecedores', suppliers, 'Fornecedores da filial'),
				metric('Pedidos de compra', purchases, 'Pedidos registrados'),
				{
					...metric('Vendas concluídas', sales._count, 'Pedidos de venda'),
					value: String(sales._count),
				},
				{
					...metric(
						'Valor vendido',
						0,
						'Vendas concluídas, incluindo valores a prazo',
					),
					value: ((sales._sum.totalCents ?? 0) / 100).toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}),
				},
			],
			salesPulse: {
				title: 'Vendas',
				description:
					'Pedidos de venda persistidos. Consulte os registros em Pedidos de venda.',
				status: 'Disponível',
				hours: [],
				values: [],
			},
			spotlight: {
				eyebrow: 'Filial ativa',
				name: store.name,
				description: 'Dados isolados por empresa e filial.',
			},
			inventoryRisk: {
				title: 'Estoque abaixo do mínimo',
				description: 'At? dez produtos que precisam de reposição.',
				rows: risk.map((row) => ({
					product: row.name,
					sku: row.sku,
					stock: row.currentStock,
					demand: row.minimumStock,
					action: 'Repor estoque',
				})),
			},
			actionRail: [],
			checklist: [],
		};
	}
	async getInventory(
		_userId: string,
		query: DashboardListQuery = {},
	): Promise<DashboardInventory> {
		const where: Prisma.ProductWhereInput = {
			...this.scope(),
			name: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
		};
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.product.findMany({
				where,
				take: query.perPage ?? 20,
				skip: ((query.page ?? 1) - 1) * (query.perPage ?? 20),
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			}),
			this.prisma.product.count({ where }),
		]);
		return {
			summary: [metric('Produtos', total, 'Produtos encontrados')],
			products: rows.map((row) => ({
				id: row.id,
				name: row.name,
				sku: row.sku,
				stock: row.currentStock,
				status: row.status,
			})),
			movements: [],
		};
	}
	async getSuppliers(
		_userId: string,
		query: DashboardListQuery = {},
	): Promise<DashboardSuppliers> {
		const where: Prisma.SupplierWhereInput = {
			...this.scope(),
			name: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
		};
		const rows = await this.prisma.supplier.findMany({
			where,
			take: query.perPage ?? 20,
			skip: ((query.page ?? 1) - 1) * (query.perPage ?? 20),
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		});
		return {
			summary: [
				metric(
					'Fornecedores',
					await this.prisma.supplier.count({ where }),
					'Fornecedores encontrados',
				),
			],
			suppliers: rows.map((row) => ({
				id: row.id,
				name: row.name,
				status: row.status,
			})),
			receivings: [],
		};
	}
	async getReports(_userId: string): Promise<DashboardReports> {
		const where = this.scope();
		const [products, suppliers, movements, purchases, sales, receivables] =
			await Promise.all([
				this.prisma.product.count({ where }),
				this.prisma.supplier.count({ where }),
				this.prisma.inventoryMovement.count({ where }),
				this.prisma.purchaseOrder.count({ where }),
				this.prisma.saleOrder.aggregate({
					where: { ...where, status: 'COMPLETED' },
					_count: true,
					_sum: { totalCents: true },
				}),
				this.prisma.saleInstallment.aggregate({
					where: { order: { ...where, status: 'COMPLETED' } },
					_sum: { amountCents: true, paidCents: true },
				}),
			]);
		return {
			summary: [
				metric('Produtos', products, 'Catálogo da filial'),
				metric('Fornecedores', suppliers, 'Fornecedores cadastrados'),
				metric('Movimentações', movements, 'Movimentações registradas'),
				metric('Compras', purchases, 'Pedidos registrados'),
				metric('Vendas', sales._count, 'Pedidos concluídos'),
				{
					...metric('Valor vendido', 0, 'Total dos pedidos concluídos'),
					value: ((sales._sum.totalCents ?? 0) / 100).toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}),
				},
				{
					...metric(
						'Saldo a receber',
						0,
						'Parcelas com saldo, incluindo atrasadas',
					),
					value: (
						((receivables._sum.amountCents ?? 0) -
							(receivables._sum.paidCents ?? 0)) /
						100
					).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
				},
			],
			reports: [],
			series: [],
			periods: [],
		};
	}
	async getCustomers(
		_userId: string,
		query: DashboardListQuery = {},
	): Promise<DashboardCustomers> {
		const where: Prisma.CustomerWhereInput = {
			...this.scope(),
			OR: query.q
				? [
						{ name: { contains: query.q, mode: 'insensitive' } },
						{ email: { contains: query.q, mode: 'insensitive' } },
					]
				: undefined,
		};
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.customer.findMany({
				where,
				take: query.perPage ?? 20,
				skip: ((query.page ?? 1) - 1) * (query.perPage ?? 20),
				orderBy: [{ name: 'asc' }, { id: 'asc' }],
			}),
			this.prisma.customer.count({ where }),
		]);
		return {
			summary: [metric('Clientes', total, 'Clientes comerciais da filial')],
			customers: rows.map((row) => ({
				id: row.id,
				name: row.name,
				email: row.email ?? '',
				phone: row.phone ?? '',
				status: row.status,
			})),
			segments: [],
			total,
			page: query.page ?? 1,
			perPage: query.perPage ?? 20,
			totalPages: Math.ceil(total / (query.perPage ?? 20)),
		};
	}
	async getCustomerDetail(
		_userId: string,
		customerId: string,
	): Promise<DashboardCustomerDetail> {
		const row = await this.prisma.customer.findFirst({
			where: { id: customerId, ...this.scope() },
		});
		if (!row) throw new NotFoundError('Cliente não encontrado nesta filial.');
		return {
			id: row.id,
			name: row.name,
			description: row.status,
			email: row.email ?? '',
			phone: row.phone ?? '',
			tags: [],
			stats: [],
			recentOrders: [],
			notes: row.notes ? [row.notes] : [],
			loyaltyTier: {
				title: 'Fidelidade indisponível',
				description: 'Sem módulo de fidelidade persistido.',
				progress: 0,
			},
			nextActions: [],
			timeline: [],
		};
	}
	async getOrders(
		_userId: string,
		query: DashboardListQuery = {},
	): Promise<DashboardOrders> {
		const result = await new SalesService(this.prisma).list(
			this.scope().storeId,
			{ page: query.page ?? 1, perPage: query.perPage ?? 20, q: query.q },
		);
		return {
			summary: [
				metric('Pedidos', result.total, 'Pedidos registrados na filial'),
			],
			queues: [],
			orders: result.items.map((order) => ({
				id: order.id,
				customer: order.customerName ?? 'Consumidor avulso',
				status: order.status,
				totalCents: order.totalCents,
				balanceCents:
					order.status === 'CANCELLED'
						? 0
						: order.installments.reduce(
								(sum, item) => sum + item.amountCents - item.paidCents,
								0,
							),
				createdAt: order.createdAt.toISOString(),
			})),
		};
	}
	async getCashRegister(): Promise<DashboardCashRegister> {
		const cash = await new SalesService(this.prisma).cash(this.scope().storeId);
		return {
			summary: [
				metric(
					'Dinheiro esperado (centavos)',
					cash.current?.expectedCents ?? 0,
					cash.current ? 'Caixa aberto' : 'Caixa fechado',
				),
			],
			paymentMethods: ['CASH', 'PIX', 'CARD'].map((method) => ({
				method,
				amountCents:
					cash.current?.payments
						.filter((payment) => payment.method === method)
						.reduce((sum, payment) => sum + payment.amountCents, 0) ?? 0,
			})),
			currentSale: [],
			closingTasks: cash.history.map((session) => ({
				id: session.id,
				expectedCents: session.expectedCents ?? 0,
				countedCents: session.countedCents ?? 0,
				closedAt: session.closedAt!.toISOString(),
			})),
		};
	}
	async getCustomerPromissory(
		_userId: string,
		customerId: string,
	): Promise<DashboardCustomerPromissory> {
		const account = await new SalesService(this.prisma).account(
			this.scope().storeId,
			customerId,
		);
		return {
			customerId,
			customerName: account.customer.name,
			alertTitle:
				account.overdueCents > 0
					? 'Existem parcelas em atraso'
					: 'Sem parcelas em atraso',
			alertDescription: 'Vencimentos avaliados no horário de Fortaleza.',
			metrics: [
				{
					label: 'Saldo a receber',
					balanceCents: account.balanceCents,
					overdueCents: account.overdueCents,
				},
			],
			installments: account.installments.map((item) => ({
				id: item.id,
				orderId: item.orderId,
				number: item.number,
				dueDate: item.dueDate,
				amountCents: item.amountCents,
				paidCents: item.paidCents,
				status: item.status,
			})),
			purchases: [],
			timeline: account.installments.flatMap((item) =>
				item.payments.map((payment) => ({
					id: payment.id,
					installmentId: item.id,
					amountCents: payment.amountCents,
					method: payment.method,
					createdAt: payment.createdAt.toISOString(),
				})),
			),
			risk: {
				label: 'Saldo em atraso',
				value: String(account.overdueCents),
				description: 'Centavos; não representa classificação de crédito.',
				progress: account.balanceCents
					? Math.round((account.overdueCents / account.balanceCents) * 100)
					: 0,
			},
		};
	}
}
