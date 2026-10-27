import { createHash, randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { DomainError } from '../../app/http/errors/domain-error';
import { NotFoundError } from '../../app/http/errors/not-found-error';

export type SalesScope = { storeId: string; userId: string };
export type SaleInput = {
	requestKey: string;
	customerId?: string;
	notes?: string;
	items: { productId: string; quantity: number }[];
	installments: { dueDate: string; amountCents: number }[];
	payment?: { amountCents: number; method: 'CASH' | 'PIX' | 'CARD' };
};
const includeOrder = {
	items: true,
	installments: {
		orderBy: { number: 'asc' as const },
		include: { payments: true },
	},
};
export function businessDate(now = new Date()) {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Fortaleza',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(now);
}
export function installmentStatus(
	amount: number,
	paid: number,
	due: string,
	today = businessDate(),
) {
	return paid >= amount
		? 'PAID'
		: due < today
			? 'OVERDUE'
			: paid > 0
				? 'PARTIAL'
				: 'OPEN';
}
function hash(input: unknown) {
	return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}
function check(condition: unknown, message: string): asserts condition {
	if (!condition) throw new DomainError(message);
}
function safeTotal(values: number[]) {
	const result = values.reduce((sum, value) => sum + value, 0);
	check(
		Number.isSafeInteger(result) && result > 0 && result <= 2_000_000_000,
		'Total fora do limite permitido.',
	);
	return result;
}

/** Monetary amounts are integer cents. Each mutation locks the store inside the
 * same database transaction as stock, receivables and cash writes. */
export class SalesService {
	constructor(private readonly db: PrismaClient) {}
	private transaction<T>(
		scope: SalesScope,
		operation: (tx: Prisma.TransactionClient) => Promise<T>,
	) {
		return this.db.$transaction(
			async (tx) => {
				const stores = await tx.$queryRaw<
					{ id: string }[]
				>`SELECT id FROM stores WHERE id = ${scope.storeId} FOR UPDATE`;
				if (!stores.length) throw new NotFoundError('Filial não encontrada.');
				return operation(tx);
			},
			{ timeout: 15000 },
		);
	}
	private async openSession(tx: Prisma.TransactionClient, storeId: string) {
		const session = await tx.cashSession.findFirst({
			where: { storeId, closedAt: null },
		});
		check(session, 'Abra o caixa antes de registrar recebimentos ou estornos.');
		return session;
	}
	async create(scope: SalesScope, input: SaleInput) {
		return this.transaction(scope, async (tx) => {
			const requestHash = hash(input);
			const previous = await tx.saleOrder.findUnique({
				where: {
					storeId_requestKey: {
						storeId: scope.storeId,
						requestKey: input.requestKey,
					},
				},
				include: includeOrder,
			});
			if (previous) {
				check(
					previous.requestHash === requestHash,
					'A chave de operação já foi usada com outros dados.',
				);
				return previous;
			}
			check(
				new Set(input.items.map((item) => item.productId)).size ===
					input.items.length,
				'Agrupe quantidades do mesmo produto em uma linha.',
			);
			const customer = input.customerId
				? await tx.customer.findFirst({
						where: {
							id: input.customerId,
							storeId: scope.storeId,
							status: 'ACTIVE',
						},
					})
				: null;
			check(
				!input.customerId || customer,
				'Cliente ativo não encontrado nesta filial.',
			);
			const products = await tx.product.findMany({
				where: {
					storeId: scope.storeId,
					id: { in: input.items.map((item) => item.productId) },
					status: 'active',
				},
			});
			const items = input.items.map((item) => {
				const product = products.find(
					(product) => product.id === item.productId,
				);
				check(
					product?.salePrice,
					'Produto indisponível ou sem preço de venda.',
				);
				const unitPriceCents = Number(product.salePrice.mul(100).toFixed(0));
				check(unitPriceCents > 0, 'O preço de venda deve ser positivo.');
				return {
					productId: product.id,
					name: product.name,
					sku: product.sku,
					quantity: item.quantity,
					unitPriceCents,
					tracked: product.inventoryControl === 'tracked',
				};
			});
			const totalCents = safeTotal(
				items.map((item) => item.quantity * item.unitPriceCents),
			);
			check(
				safeTotal(input.installments.map((item) => item.amountCents)) ===
					totalCents,
				'A soma das parcelas deve corresponder ao total da venda.',
			);
			const paid = input.payment?.amountCents ?? 0;
			check(paid <= totalCents, 'Recebimento maior que o total da venda.');
			check(
				customer || paid === totalCents,
				'Selecione um cliente para vendas com saldo a receber.',
			);
			const session =
				paid > 0 ? await this.openSession(tx, scope.storeId) : null;
			const id = randomUUID();
			for (const item of items.filter((item) => item.tracked)) {
				const updated = await tx.product.updateMany({
					where: {
						id: item.productId,
						storeId: scope.storeId,
						currentStock: { gte: item.quantity },
					},
					data: { currentStock: { decrement: item.quantity } },
				});
				check(updated.count === 1, `Estoque insuficiente para ${item.name}.`);
				const product = await tx.product.findUniqueOrThrow({
					where: { id: item.productId },
				});
				await tx.inventoryMovement.create({
					data: {
						...scope,
						productId: item.productId,
						type: 'out',
						quantity: item.quantity,
						previousStock: product.currentStock + item.quantity,
						currentStock: product.currentStock,
						reason: `Venda ${id}`,
					},
				});
			}
			const order = await tx.saleOrder.create({
				data: {
					id,
					...scope,
					customerId: customer?.id,
					customerName: customer?.name,
					requestKey: input.requestKey,
					requestHash,
					notes: input.notes,
					totalCents,
					items: { create: items },
					installments: {
						create: input.installments.map((item, index) => ({
							...item,
							number: index + 1,
						})),
					},
				},
				include: includeOrder,
			});
			let remaining = paid;
			for (const installment of order.installments) {
				const amountCents = Math.min(remaining, installment.amountCents);
				if (amountCents && session && input.payment) {
					await tx.salePayment.create({
						data: {
							installmentId: installment.id,
							cashSessionId: session.id,
							userId: scope.userId,
							requestKey: `${input.requestKey}:${installment.number}`,
							amountCents,
							method: input.payment.method,
						},
					});
					await tx.saleInstallment.update({
						where: { id: installment.id },
						data: { paidCents: amountCents },
					});
					remaining -= amountCents;
				}
			}
			return tx.saleOrder.findUniqueOrThrow({
				where: { id },
				include: includeOrder,
			});
		});
	}
	async list(
		storeId: string,
		query: {
			page: number;
			perPage: number;
			customerId?: string;
			q?: string;
			status?: string;
		},
	) {
		const where: Prisma.SaleOrderWhereInput = {
			storeId,
			customerId: query.customerId,
			status: query.status,
			...(query.q
				? {
						OR: [
							{ id: { contains: query.q, mode: 'insensitive' } },
							{ customerName: { contains: query.q, mode: 'insensitive' } },
							{
								items: {
									some: { name: { contains: query.q, mode: 'insensitive' } },
								},
							},
						],
					}
				: {}),
		};
		const [items, total] = await this.db.$transaction([
			this.db.saleOrder.findMany({
				where,
				include: includeOrder,
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.db.saleOrder.count({ where }),
		]);
		return {
			items,
			total,
			page: query.page,
			perPage: query.perPage,
			totalPages: Math.ceil(total / query.perPage),
		};
	}
	async detail(storeId: string, id: string) {
		const order = await this.db.saleOrder.findFirst({
			where: { storeId, id },
			include: includeOrder,
		});
		if (!order) throw new NotFoundError('Pedido não encontrado nesta filial.');
		return order;
	}
	async account(storeId: string, customerId: string) {
		const customer = await this.db.customer.findFirst({
			where: { id: customerId, storeId },
		});
		if (!customer)
			throw new NotFoundError('Cliente não encontrado nesta filial.');
		const installments = await this.db.saleInstallment.findMany({
			where: { order: { storeId, customerId, status: 'COMPLETED' } },
			include: {
				payments: true,
				order: { select: { id: true, createdAt: true } },
			},
			orderBy: [{ dueDate: 'asc' }, { number: 'asc' }],
		});
		const titles = installments.map((item) => ({
			...item,
			balanceCents: item.amountCents - item.paidCents,
			status: installmentStatus(item.amountCents, item.paidCents, item.dueDate),
		}));
		return {
			customer,
			today: businessDate(),
			timezone: 'America/Fortaleza',
			balanceCents: titles.reduce((sum, item) => sum + item.balanceCents, 0),
			overdueCents: titles
				.filter((item) => item.status === 'OVERDUE')
				.reduce((sum, item) => sum + item.balanceCents, 0),
			installments: titles,
		};
	}
	async pay(
		scope: SalesScope,
		id: string,
		input: { requestKey: string; amountCents: number; method: string },
	) {
		return this.transaction(scope, async (tx) => {
			const title = await tx.saleInstallment.findFirst({
				where: { id, order: { storeId: scope.storeId, status: 'COMPLETED' } },
			});
			if (!title)
				throw new NotFoundError('Parcela não encontrada nesta filial.');
			const previous = await tx.salePayment.findFirst({
				where: {
					requestKey: input.requestKey,
					cashSession: { storeId: scope.storeId },
				},
			});
			if (previous) {
				check(
					previous.installmentId === id &&
						previous.amountCents === input.amountCents &&
						previous.method === input.method,
					'A chave de operação já foi usada com outros dados.',
				);
				return previous;
			}
			check(
				input.amountCents <= title.amountCents - title.paidCents,
				'Recebimento maior que o saldo da parcela.',
			);
			const session = await this.openSession(tx, scope.storeId);
			const payment = await tx.salePayment.create({
				data: {
					...input,
					userId: scope.userId,
					installmentId: id,
					cashSessionId: session.id,
				},
			});
			await tx.saleInstallment.update({
				where: { id },
				data: { paidCents: { increment: input.amountCents } },
			});
			return payment;
		});
	}
	async cancel(scope: SalesScope, id: string, reason: string) {
		return this.transaction(scope, async (tx) => {
			const order = await tx.saleOrder.findFirst({
				where: { id, storeId: scope.storeId },
				include: includeOrder,
			});
			if (!order)
				throw new NotFoundError('Pedido não encontrado nesta filial.');
			if (order.status === 'CANCELLED') return order;
			// A paid sale requires a separate refund workflow; never silently erase receipts.
			check(
				order.installments.every((item) => item.paidCents === 0),
				'Pedido com recebimentos não pode ser cancelado. É necessário tratar a devolução e o estorno antes.',
			);
			for (const item of order.items.filter((item) => item.tracked)) {
				const product = await tx.product.findFirst({
					where: { id: item.productId, storeId: scope.storeId },
				});
				check(
					product,
					'Produto removido; não é possível recompor o estoque automaticamente.',
				);
				const updated = await tx.product.update({
					where: { id: product.id },
					data: { currentStock: { increment: item.quantity } },
				});
				await tx.inventoryMovement.create({
					data: {
						...scope,
						productId: product.id,
						type: 'in',
						quantity: item.quantity,
						previousStock: updated.currentStock - item.quantity,
						currentStock: updated.currentStock,
						reason: `Cancelamento ${id}: ${reason}`,
					},
				});
			}
			return tx.saleOrder.update({
				where: { id },
				data: {
					status: 'CANCELLED',
					cancelledAt: new Date(),
					cancelledBy: scope.userId,
					cancellationReason: reason,
				},
				include: includeOrder,
			});
		});
	}
	private expected(session: {
		openingCents: number;
		payments: { method: string; amountCents: number }[];
		movements: { kind: string; amountCents: number }[];
	}) {
		return (
			session.openingCents +
			session.payments
				.filter((item) => item.method === 'CASH')
				.reduce((sum, item) => sum + item.amountCents, 0) +
			session.movements.reduce(
				(sum, item) =>
					sum + (item.kind === 'SUPPLY' ? item.amountCents : -item.amountCents),
				0,
			)
		);
	}
	async cash(storeId: string, page = 1) {
		const include = {
			movements: { orderBy: { createdAt: 'desc' as const } },
			payments: { orderBy: { createdAt: 'desc' as const } },
		};
		const [current, history, total] = await this.db.$transaction([
			this.db.cashSession.findFirst({
				where: { storeId, closedAt: null },
				include,
			}),
			this.db.cashSession.findMany({
				where: { storeId, closedAt: { not: null } },
				include,
				orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
				skip: (page - 1) * 10,
				take: 10,
			}),
			this.db.cashSession.count({
				where: { storeId, closedAt: { not: null } },
			}),
		]);
		return {
			current: current
				? { ...current, expectedCents: this.expected(current) }
				: null,
			history,
			total,
			page,
			totalPages: Math.ceil(total / 10),
		};
	}
	async open(scope: SalesScope, openingCents: number) {
		return this.transaction(scope, async (tx) => {
			check(
				!(await tx.cashSession.findFirst({
					where: { storeId: scope.storeId, closedAt: null },
				})),
				'Já existe um caixa aberto nesta filial.',
			);
			return tx.cashSession.create({
				data: { storeId: scope.storeId, openedBy: scope.userId, openingCents },
			});
		});
	}
	async move(
		scope: SalesScope,
		input: {
			requestKey: string;
			amountCents: number;
			kind: 'SUPPLY' | 'WITHDRAWAL';
			reason: string;
		},
	) {
		return this.transaction(scope, async (tx) => {
			const previous = await tx.cashMovement.findFirst({
				where: {
					cashSession: { storeId: scope.storeId },
					requestKey: input.requestKey,
				},
			});
			if (previous) {
				check(
					previous.amountCents === input.amountCents &&
						previous.kind === input.kind &&
						previous.reason === input.reason,
					'A chave de operação já foi usada com outros dados.',
				);
				return previous;
			}
			const session = await this.openSession(tx, scope.storeId);
			const details = await tx.cashSession.findUniqueOrThrow({
				where: { id: session.id },
				include: { movements: true, payments: true },
			});
			check(
				input.kind === 'SUPPLY' || input.amountCents <= this.expected(details),
				'Sangria maior que o saldo em dinheiro.',
			);
			return tx.cashMovement.create({
				data: { ...input, cashSessionId: session.id, userId: scope.userId },
			});
		});
	}
	async close(
		scope: SalesScope,
		id: string,
		countedCents: number,
		notes?: string,
	) {
		return this.transaction(scope, async (tx) => {
			const session = await tx.cashSession.findFirst({
				where: { id, storeId: scope.storeId },
				include: { payments: true, movements: true },
			});
			if (!session)
				throw new NotFoundError('Caixa não encontrado nesta filial.');
			if (session.closedAt) {
				check(
					session.countedCents === countedCents &&
						session.notes === (notes ?? null),
					'Este caixa já foi fechado com outra conferência.',
				);
				return session;
			}
			return tx.cashSession.update({
				where: { id },
				data: {
					closedAt: new Date(),
					closedBy: scope.userId,
					countedCents,
					expectedCents: this.expected(session),
					notes,
				},
			});
		});
	}
}
