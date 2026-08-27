import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import type {
	CatalogListQuery,
	CatalogScope,
	CreateInventoryAdjustmentInput,
	CreateProductInput,
	CreatePurchaseOrderInput,
	CreateReceivingInput,
	CreateSupplierInput,
	CreateSupplierResponsibleInput,
	InventoryAdjustmentType,
	InventoryMovement,
	PreparedProductImageUpload,
	PrepareProductImageUploadInput,
	Product,
	ProductImageAsset,
	ProductStatus,
	PurchaseOrder,
	PurchaseOrderItem,
	PurchaseOrderStatus,
	Receiving,
	ReceivingStatus,
	Supplier,
	SupplierCategory,
	SupplierOperationalSummary,
	SupplierResponsible,
	SupplierResponsibleContactType,
	SupplierStatus,
	SupplierTerm,
	UpdateProductInput,
	UpdatePurchaseOrderInput,
	UpdateReceivingInput,
	UpdateSupplierInput,
	UpdateSupplierResponsibleInput,
} from '../../../domain/entities/catalog';
import type { CatalogRepository } from '../../../domain/repositories/catalog-repository';
import { createProductSku } from '../../../domain/value-objects/product-sku';
import {
	createR2PresignedUpload,
	type R2StorageConfig,
} from '../../storage/r2-presigned-upload';

type PrismaSupplierWithResponsibles = Prisma.SupplierGetPayload<{
	include: { responsibles: true };
}>;

type PrismaProductWithImages = Prisma.ProductGetPayload<{
	include: { images: true };
}>;

type PrismaPurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<{
	include: { items: true };
}>;

export class PrismaCatalogRepository implements CatalogRepository {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly r2StorageConfig?: R2StorageConfig,
	) {}

	async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
		if (input.document) {
			const existing = await this.findSupplierByDocument(input, input.document);
			if (existing) {
				throw new DomainError('Fornecedor com este documento já existe.');
			}
		}

		const supplier = await this.prisma.supplier.create({
			data: {
				category: input.category,
				deliveryTerm: input.deliveryTerm,
				document: input.document,
				email: input.email,
				minimumOrder: input.minimumOrder,
				name: input.name,
				notes: input.notes,
				paymentTerm: input.paymentTerm,
				phone: input.phone,
				responsibles: input.responsibles
					? {
							create: input.responsibles.map((responsible) => ({
								...responsible,
								storeId: input.storeId,
								userId: input.userId,
							})),
						}
					: undefined,
				status: input.status ?? 'active',
				storeId: input.storeId,
				userId: input.userId,
			},
			include: { responsibles: true },
		});

		return toDomainSupplier(supplier);
	}

	async findSupplierById(
		scope: CatalogScope,
		supplierId: string,
	): Promise<Supplier | null> {
		const supplier = await this.prisma.supplier.findFirst({
			where: {
				id: supplierId,
				storeId: scope.storeId,
				userId: scope.userId,
			},
			include: { responsibles: true },
		});

		return supplier ? toDomainSupplier(supplier) : null;
	}

	async findSupplierByDocument(
		scope: CatalogScope,
		document: string,
	): Promise<Supplier | null> {
		const supplier = await this.prisma.supplier.findFirst({
			where: {
				document,
				storeId: scope.storeId,
			},
			include: { responsibles: true },
		});

		return supplier ? toDomainSupplier(supplier) : null;
	}

	async listSuppliers(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<Supplier[]> {
		const where: Prisma.SupplierWhereInput = {
			storeId: scope.storeId,
			userId: scope.userId,
			...getStatusWhere(query.status),
			...getSupplierSearchWhere(query.q),
		};

		const suppliers = await this.prisma.supplier.findMany({
			where,
			include: { responsibles: true },
			orderBy: { createdAt: 'desc' },
			...getPaginationArgs(query),
		});

		return suppliers.map(toDomainSupplier);
	}

	async getSupplierOperationalSummary(
		scope: CatalogScope,
	): Promise<SupplierOperationalSummary> {
		const supplierWhere: Prisma.SupplierWhereInput = {
			storeId: scope.storeId,
			userId: scope.userId,
		};
		const orderWhere: Prisma.PurchaseOrderWhereInput = {
			storeId: scope.storeId,
			userId: scope.userId,
		};
		const receivingWhere: Prisma.ReceivingWhereInput = {
			storeId: scope.storeId,
			userId: scope.userId,
		};
		const [
			totalSuppliers,
			activeSuppliers,
			suppliersWithResponsible,
			openOrders,
			delayedOrders,
			delayedReceivings,
			dueReceivings,
		] = await this.prisma.$transaction([
			this.prisma.supplier.count({ where: supplierWhere }),
			this.prisma.supplier.count({
				where: { ...supplierWhere, status: 'active' },
			}),
			this.prisma.supplier.count({
				where: { ...supplierWhere, responsibles: { some: {} } },
			}),
			this.prisma.purchaseOrder.aggregate({
				where: {
					...orderWhere,
					status: { notIn: ['completed', 'cancelled'] },
				},
				_count: { _all: true },
				_sum: { totalCost: true },
			}),
			this.prisma.purchaseOrder.count({
				where: { ...orderWhere, status: 'delayed' },
			}),
			this.prisma.receiving.count({
				where: { ...receivingWhere, status: 'delayed' },
			}),
			this.prisma.receiving.count({
				where: {
					...receivingWhere,
					status: { in: ['scheduled', 'checking', 'delayed'] },
				},
			}),
		]);

		return {
			activeSuppliers,
			delayedOrders,
			delayedReceivings,
			dueReceivings,
			openOrderValue: Number(openOrders._sum.totalCost ?? 0),
			openOrders: openOrders._count._all,
			suppliersWithResponsible,
			totalSuppliers,
		};
	}

	async updateSupplier(input: UpdateSupplierInput): Promise<Supplier> {
		const supplier = await this.prisma.supplier.findFirst({
			where: {
				id: input.id,
				storeId: input.storeId,
				userId: input.userId,
			},
		});
		if (!supplier) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		if (input.document && input.document !== supplier.document) {
			const existing = await this.findSupplierByDocument(input, input.document);
			if (existing) {
				throw new DomainError('Fornecedor com este documento já existe.');
			}
		}

		const updated = await this.prisma.supplier.update({
			where: { id: input.id },
			data: getSupplierUpdateData(input),
			include: { responsibles: true },
		});

		return toDomainSupplier(updated);
	}

	async deleteSupplier(scope: CatalogScope, supplierId: string): Promise<void> {
		const supplier = await this.prisma.supplier.findFirst({
			where: {
				id: supplierId,
				storeId: scope.storeId,
				userId: scope.userId,
			},
			select: {
				_count: {
					select: {
						purchaseOrders: true,
						receivings: true,
					},
				},
				id: true,
			},
		});
		if (!supplier) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}
		if (supplier._count.purchaseOrders > 0 || supplier._count.receivings > 0) {
			throw new DomainError(
				'Fornecedor possui pedidos ou recebimentos e não pode ser excluído. Inative o cadastro para preservar o histórico.',
			);
		}

		await this.prisma.supplier.delete({ where: { id: supplierId } });
	}

	async createSupplierResponsible(
		input: CreateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input, input.supplierId);

		const responsible = await this.prisma.$transaction(async (tx) => {
			if (input.isPrimary) {
				await tx.supplierResponsible.updateMany({
					where: {
						storeId: input.storeId,
						supplierId: input.supplierId,
						userId: input.userId,
					},
					data: { isPrimary: false },
				});
			}

			return tx.supplierResponsible.create({
				data: {
					contactType: input.contactType,
					email: input.email,
					isPrimary: input.isPrimary,
					name: input.name,
					phone: input.phone,
					role: input.role,
					status: input.status,
					storeId: input.storeId,
					supplierId: input.supplierId,
					userId: input.userId,
				},
			});
		});

		return toDomainSupplierResponsible(responsible);
	}

	async deleteSupplierResponsible(
		scope: CatalogScope,
		supplierId: string,
		responsibleId: string,
	): Promise<void> {
		await this.ensureSupplier(scope, supplierId);
		const responsible = await this.prisma.supplierResponsible.findFirst({
			where: {
				id: responsibleId,
				storeId: scope.storeId,
				supplierId,
				userId: scope.userId,
			},
		});
		if (!responsible) {
			throw new NotFoundError('Responsável não encontrado.');
		}

		await this.prisma.supplierResponsible.delete({
			where: { id: responsibleId },
		});
	}

	async listSupplierResponsibles(
		scope: CatalogScope,
		supplierId: string,
	): Promise<SupplierResponsible[]> {
		await this.ensureSupplier(scope, supplierId);
		const responsibles = await this.prisma.supplierResponsible.findMany({
			where: {
				storeId: scope.storeId,
				supplierId,
				userId: scope.userId,
			},
			orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
		});

		return responsibles.map(toDomainSupplierResponsible);
	}

	async updateSupplierResponsible(
		input: UpdateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input, input.supplierId);
		const responsible = await this.prisma.supplierResponsible.findFirst({
			where: {
				id: input.id,
				storeId: input.storeId,
				supplierId: input.supplierId,
				userId: input.userId,
			},
		});
		if (!responsible) {
			throw new NotFoundError('Responsável não encontrado.');
		}

		const updated = await this.prisma.$transaction(async (tx) => {
			if (input.isPrimary) {
				await tx.supplierResponsible.updateMany({
					where: {
						storeId: input.storeId,
						supplierId: input.supplierId,
						userId: input.userId,
					},
					data: { isPrimary: false },
				});
			}

			return tx.supplierResponsible.update({
				where: { id: input.id },
				data: getResponsibleUpdateData(input),
			});
		});

		return toDomainSupplierResponsible(updated);
	}

	async createProduct(input: CreateProductInput): Promise<Product> {
		const id = randomUUID();
		if (input.barcode) {
			const productWithBarcode = await this.findProductByBarcode(
				input,
				input.barcode,
			);
			if (productWithBarcode) {
				throw new DomainError('Produto com este código de barras já existe.');
			}
		}

		if (input.supplierId) {
			await this.ensureSupplier(input, input.supplierId);
		}

		const product = await this.prisma.product.create({
			data: {
				barcode: input.barcode,
				costPrice: input.costPrice,
				currentStock:
					input.inventoryControl === 'untracked'
						? 0
						: (input.currentStock ?? 0),
				description: input.description,
				id,
				inventoryControl: input.inventoryControl ?? 'tracked',
				minimumStock:
					input.inventoryControl === 'untracked'
						? 0
						: (input.minimumStock ?? 0),
				name: input.name,
				salePrice: input.salePrice,
				sku: createProductSku(id),
				status: 'active',
				storeId: input.storeId,
				supplierId: input.supplierId,
				userId: input.userId,
			},
			include: { images: true },
		});

		return toDomainProduct(product);
	}

	async findProductById(
		scope: CatalogScope,
		productId: string,
	): Promise<Product | null> {
		const product = await this.prisma.product.findFirst({
			where: {
				id: productId,
				storeId: scope.storeId,
				userId: scope.userId,
			},
			include: { images: true },
		});

		return product ? toDomainProduct(product) : null;
	}

	async findProductBySku(
		scope: CatalogScope,
		sku: string,
	): Promise<Product | null> {
		const product = await this.prisma.product.findFirst({
			where: {
				sku,
				storeId: scope.storeId,
			},
			include: { images: true },
		});

		return product ? toDomainProduct(product) : null;
	}

	async findProductByBarcode(
		scope: CatalogScope,
		barcode: string,
	): Promise<Product | null> {
		const product = await this.prisma.product.findFirst({
			where: { barcode, storeId: scope.storeId },
			include: { images: true },
		});

		return product ? toDomainProduct(product) : null;
	}

	async listProducts(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<Product[]> {
		const where: Prisma.ProductWhereInput = {
			storeId: scope.storeId,
			userId: scope.userId,
			...getStatusWhere(query.status),
			...getProductSearchWhere(query.q),
		};

		const products = await this.prisma.product.findMany({
			where,
			include: { images: true },
			orderBy: { createdAt: 'desc' },
			...getPaginationArgs(query),
		});

		return products.map(toDomainProduct);
	}

	async updateProduct(input: UpdateProductInput): Promise<Product> {
		const product = await this.prisma.product.findFirst({
			where: {
				id: input.id,
				storeId: input.storeId,
				userId: input.userId,
			},
		});
		if (!product) {
			throw new NotFoundError('Produto não encontrado.');
		}

		if (input.barcode && input.barcode !== product.barcode) {
			const productWithBarcode = await this.findProductByBarcode(
				input,
				input.barcode,
			);
			if (productWithBarcode) {
				throw new DomainError('Produto com este código de barras já existe.');
			}
		}
		const inventoryControl = input.inventoryControl ?? product.inventoryControl;
		if (
			inventoryControl === 'untracked' &&
			((input.currentStock ?? 0) > 0 || (input.minimumStock ?? 0) > 0)
		) {
			throw new DomainError(
				'Produto sem controle de estoque não aceita saldo ou estoque mínimo.',
			);
		}

		if (input.supplierId) {
			await this.ensureSupplier(input, input.supplierId);
		}

		const updated = await this.prisma.product.update({
			where: { id: input.id },
			data: getProductUpdateData(input),
			include: { images: true },
		});

		return toDomainProduct(updated);
	}

	async createInventoryAdjustment(
		input: CreateInventoryAdjustmentInput,
	): Promise<InventoryMovement> {
		const movement = await this.prisma.$transaction(async (tx) => {
			const product = await tx.product.findFirst({
				where: {
					id: input.productId,
					storeId: input.storeId,
					userId: input.userId,
				},
			});
			if (!product) {
				throw new NotFoundError('Produto não encontrado.');
			}
			if (product.inventoryControl === 'untracked') {
				throw new DomainError(
					'Produto sem controle de estoque não aceita movimentações.',
				);
			}

			const previousStock = product.currentStock;
			const currentStock =
				input.type === 'correction'
					? input.quantity
					: input.type === 'in'
						? previousStock + input.quantity
						: previousStock - input.quantity;

			if (currentStock < 0) {
				throw new DomainError('Estoque não pode ficar negativo.');
			}

			await tx.product.update({
				where: { id: product.id },
				data: { currentStock },
			});

			return tx.inventoryMovement.create({
				data: {
					currentStock,
					previousStock,
					productId: product.id,
					quantity: input.quantity,
					reason: input.reason,
					storeId: input.storeId,
					type: input.type,
					userId: input.userId,
				},
			});
		});

		return toDomainInventoryMovement(movement);
	}

	async listInventoryMovements(
		scope: CatalogScope,
		productId?: string,
	): Promise<InventoryMovement[]> {
		const movements = await this.prisma.inventoryMovement.findMany({
			where: {
				storeId: scope.storeId,
				userId: scope.userId,
				...(productId ? { productId } : {}),
			},
			orderBy: { createdAt: 'desc' },
		});

		return movements.map(toDomainInventoryMovement);
	}

	async createPurchaseOrder(
		input: CreatePurchaseOrderInput,
	): Promise<PurchaseOrder> {
		await this.ensureSupplier(input, input.supplierId);

		for (const item of input.items) {
			if (item.productId) {
				const product = await this.findProductById(input, item.productId);
				if (!product) {
					throw new NotFoundError('Produto não encontrado.');
				}
			}
		}

		const totalCost = input.items.reduce(
			(total, item) => total + item.quantity * item.unitCost,
			0,
		);
		const totalItems = input.items.reduce(
			(total, item) => total + item.quantity,
			0,
		);
		const orderCount = await this.prisma.purchaseOrder.count({
			where: { storeId: input.storeId },
		});

		const order = await this.prisma.purchaseOrder.create({
			data: {
				code: `PO-${String(orderCount + 1).padStart(4, '0')}`,
				expectedDeliveryAt: new Date(input.expectedDeliveryAt),
				invoiceNumber: input.invoiceNumber,
				items: {
					create: input.items.map((item) => ({
						name: item.name,
						productId: item.productId,
						quantity: item.quantity,
						sku: item.sku,
						storeId: input.storeId,
						totalCost: item.quantity * item.unitCost,
						unitCost: item.unitCost,
						userId: input.userId,
					})),
				},
				notes: input.notes,
				paymentTerm: input.paymentTerm,
				status: input.status ?? 'confirmed',
				storeId: input.storeId,
				supplierId: input.supplierId,
				totalCost,
				totalItems,
				userId: input.userId,
			},
			include: { items: true },
		});

		return toDomainPurchaseOrder(order);
	}

	async listPurchaseOrders(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<PurchaseOrder[]> {
		const where: Prisma.PurchaseOrderWhereInput = {
			storeId: scope.storeId,
			supplierId: query.supplierId,
			userId: scope.userId,
			...getStatusWhere(query.status),
			...getPurchaseOrderSearchWhere(query.q),
		};
		const orders = await this.prisma.purchaseOrder.findMany({
			where,
			include: { items: true },
			orderBy: { createdAt: 'desc' },
			...getPaginationArgs(query),
		});

		return orders.map(toDomainPurchaseOrder);
	}

	async updatePurchaseOrder(
		input: UpdatePurchaseOrderInput,
	): Promise<PurchaseOrder> {
		const order = await this.prisma.purchaseOrder.findFirst({
			where: {
				id: input.id,
				storeId: input.storeId,
				userId: input.userId,
			},
		});
		if (!order) {
			throw new NotFoundError('Pedido de compra não encontrado.');
		}

		const updated = await this.prisma.purchaseOrder.update({
			where: { id: input.id },
			data: getPurchaseOrderUpdateData(input),
			include: { items: true },
		});

		return toDomainPurchaseOrder(updated);
	}

	async createReceiving(input: CreateReceivingInput): Promise<Receiving> {
		await this.ensureSupplier(input, input.supplierId);

		let itemsCount = 0;
		if (input.purchaseOrderId) {
			const order = await this.prisma.purchaseOrder.findFirst({
				where: {
					id: input.purchaseOrderId,
					storeId: input.storeId,
					userId: input.userId,
				},
			});
			if (!order) {
				throw new NotFoundError('Pedido de compra não encontrado.');
			}
			itemsCount = order.totalItems;
		}

		const receiving = await this.prisma.receiving.create({
			data: {
				discrepancies: input.discrepancies,
				dock: input.dock,
				expectedAt: new Date(input.expectedAt),
				invoiceNumber: input.invoiceNumber,
				itemsCount,
				purchaseOrderId: input.purchaseOrderId,
				receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
				receiverName: input.receiverName,
				status: input.status ?? 'scheduled',
				storeId: input.storeId,
				supplierId: input.supplierId,
				userId: input.userId,
				volumes: input.volumes,
			},
		});

		return toDomainReceiving(receiving);
	}

	async listReceivings(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<Receiving[]> {
		const where: Prisma.ReceivingWhereInput = {
			storeId: scope.storeId,
			supplierId: query.supplierId,
			userId: scope.userId,
			...getStatusWhere(query.status),
			...getReceivingSearchWhere(query.q),
		};
		const receivings = await this.prisma.receiving.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			...getPaginationArgs(query),
		});

		return receivings.map(toDomainReceiving);
	}

	async updateReceiving(input: UpdateReceivingInput): Promise<Receiving> {
		const receiving = await this.prisma.receiving.findFirst({
			where: {
				id: input.id,
				storeId: input.storeId,
				userId: input.userId,
			},
		});
		if (!receiving) {
			throw new NotFoundError('Recebimento não encontrado.');
		}

		const updated = await this.prisma.receiving.update({
			where: { id: input.id },
			data: getReceivingUpdateData(input),
		});

		return toDomainReceiving(updated);
	}

	async prepareProductImageUpload(
		input: PrepareProductImageUploadInput,
	): Promise<PreparedProductImageUpload> {
		const product = await this.prisma.product.findFirst({
			where: {
				id: input.productId,
				storeId: input.storeId,
				userId: input.userId,
			},
		});
		if (!product) {
			throw new NotFoundError('Produto não encontrado.');
		}

		const key = `${input.storeBucketKey}/products/${input.productId}/${randomUUID()}.webp`;
		const upload = this.r2StorageConfig
			? createR2PresignedUpload(this.r2StorageConfig, {
					contentType: input.contentType,
					key,
				})
			: {
					headers: { 'content-type': 'image/webp' },
					key,
					method: 'PUT' as const,
					publicUrl: `r2://store-flow/${key}`,
					url: `https://r2.local.test/${key}`,
				};

		const asset = await this.prisma.productImageAsset.create({
			data: {
				contentType: input.contentType,
				fileName: input.fileName,
				key,
				productId: input.productId,
				publicUrl: upload.publicUrl,
				size: input.size,
				storeId: input.storeId,
				userId: input.userId,
			},
		});

		return {
			asset: toDomainProductImageAsset(asset),
			upload,
		};
	}

	async deleteProductImageAsset(
		scope: CatalogScope,
		productId: string,
		assetId: string,
	): Promise<void> {
		const asset = await this.prisma.productImageAsset.findFirst({
			where: {
				id: assetId,
				productId,
				storeId: scope.storeId,
				userId: scope.userId,
			},
		});
		if (!asset) throw new NotFoundError('Imagem do produto não encontrada.');
		await this.prisma.productImageAsset.delete({ where: { id: asset.id } });
	}

	private async ensureSupplier(scope: CatalogScope, supplierId: string) {
		const supplier = await this.prisma.supplier.findFirst({
			where: {
				id: supplierId,
				storeId: scope.storeId,
				userId: scope.userId,
			},
		});
		if (!supplier) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		return supplier;
	}
}

function getPaginationArgs(query: CatalogListQuery) {
	const page = query.page ?? 1;
	const perPage = query.perPage ?? 20;
	return {
		skip: (page - 1) * perPage,
		take: perPage,
	};
}

function getSupplierSearchWhere(
	q: string | undefined,
): Prisma.SupplierWhereInput {
	const search = q?.trim();
	if (!search) {
		return {};
	}

	return {
		OR: [
			{ name: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ document: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ email: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ category: { contains: search, mode: Prisma.QueryMode.insensitive } },
		],
	};
}

function getProductSearchWhere(
	q: string | undefined,
): Prisma.ProductWhereInput {
	const search = q?.trim();
	if (!search) {
		return {};
	}

	return {
		OR: [
			{ name: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ sku: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ barcode: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ description: { contains: search, mode: Prisma.QueryMode.insensitive } },
		],
	};
}

function getPurchaseOrderSearchWhere(
	q: string | undefined,
): Prisma.PurchaseOrderWhereInput {
	const search = q?.trim();
	if (!search) {
		return {};
	}

	return {
		OR: [
			{ code: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{
				invoiceNumber: {
					contains: search,
					mode: Prisma.QueryMode.insensitive,
				},
			},
			{ status: { contains: search, mode: Prisma.QueryMode.insensitive } },
		],
	};
}

function getReceivingSearchWhere(
	q: string | undefined,
): Prisma.ReceivingWhereInput {
	const search = q?.trim();
	if (!search) {
		return {};
	}

	return {
		OR: [
			{
				invoiceNumber: {
					contains: search,
					mode: Prisma.QueryMode.insensitive,
				},
			},
			{ status: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{ dock: { contains: search, mode: Prisma.QueryMode.insensitive } },
			{
				receiverName: {
					contains: search,
					mode: Prisma.QueryMode.insensitive,
				},
			},
		],
	};
}

function getStatusWhere(status: string | undefined) {
	const normalizedStatus = status?.trim();
	return !normalizedStatus || normalizedStatus === 'all'
		? {}
		: { status: normalizedStatus };
}

function getSupplierUpdateData(
	input: UpdateSupplierInput,
): Prisma.SupplierUpdateInput {
	const data: Prisma.SupplierUpdateInput = {};
	if (Object.hasOwn(input, 'category')) data.category = input.category;
	if (Object.hasOwn(input, 'deliveryTerm')) {
		data.deliveryTerm = input.deliveryTerm;
	}
	if (Object.hasOwn(input, 'document')) data.document = input.document;
	if (Object.hasOwn(input, 'email')) data.email = input.email;
	if (Object.hasOwn(input, 'minimumOrder')) {
		data.minimumOrder = input.minimumOrder;
	}
	if (Object.hasOwn(input, 'name')) data.name = input.name;
	if (Object.hasOwn(input, 'notes')) data.notes = input.notes;
	if (Object.hasOwn(input, 'paymentTerm')) data.paymentTerm = input.paymentTerm;
	if (Object.hasOwn(input, 'phone')) data.phone = input.phone;
	if (Object.hasOwn(input, 'status')) data.status = input.status;
	return data;
}

function getResponsibleUpdateData(
	input: UpdateSupplierResponsibleInput,
): Prisma.SupplierResponsibleUpdateInput {
	const data: Prisma.SupplierResponsibleUpdateInput = {};
	if (Object.hasOwn(input, 'contactType')) data.contactType = input.contactType;
	if (Object.hasOwn(input, 'email')) data.email = input.email;
	if (Object.hasOwn(input, 'isPrimary')) data.isPrimary = input.isPrimary;
	if (Object.hasOwn(input, 'name')) data.name = input.name;
	if (Object.hasOwn(input, 'phone')) data.phone = input.phone;
	if (Object.hasOwn(input, 'role')) data.role = input.role;
	if (Object.hasOwn(input, 'status')) data.status = input.status;
	return data;
}

function getProductUpdateData(
	input: UpdateProductInput,
): Prisma.ProductUpdateInput {
	const data: Prisma.ProductUpdateInput = {};
	if (Object.hasOwn(input, 'barcode')) data.barcode = input.barcode;
	if (Object.hasOwn(input, 'costPrice')) data.costPrice = input.costPrice;
	if (Object.hasOwn(input, 'currentStock')) {
		data.currentStock = input.currentStock;
	}
	if (Object.hasOwn(input, 'description')) data.description = input.description;
	if (Object.hasOwn(input, 'inventoryControl')) {
		data.inventoryControl = input.inventoryControl;
		if (input.inventoryControl === 'untracked') {
			data.currentStock = 0;
			data.minimumStock = 0;
		}
	}
	if (Object.hasOwn(input, 'minimumStock')) {
		data.minimumStock = input.minimumStock;
	}
	if (Object.hasOwn(input, 'name')) data.name = input.name;
	if (Object.hasOwn(input, 'salePrice')) data.salePrice = input.salePrice;
	if (Object.hasOwn(input, 'status')) data.status = input.status;
	if (Object.hasOwn(input, 'supplierId')) {
		data.supplier = input.supplierId
			? { connect: { id: input.supplierId } }
			: { disconnect: true };
	}
	return data;
}

function getPurchaseOrderUpdateData(
	input: UpdatePurchaseOrderInput,
): Prisma.PurchaseOrderUpdateInput {
	const data: Prisma.PurchaseOrderUpdateInput = {};
	if (Object.hasOwn(input, 'expectedDeliveryAt')) {
		data.expectedDeliveryAt = input.expectedDeliveryAt
			? new Date(input.expectedDeliveryAt)
			: undefined;
	}
	if (Object.hasOwn(input, 'invoiceNumber')) {
		data.invoiceNumber = input.invoiceNumber;
	}
	if (Object.hasOwn(input, 'notes')) data.notes = input.notes;
	if (Object.hasOwn(input, 'paymentTerm')) data.paymentTerm = input.paymentTerm;
	if (Object.hasOwn(input, 'status')) data.status = input.status;
	return data;
}

function getReceivingUpdateData(
	input: UpdateReceivingInput,
): Prisma.ReceivingUpdateInput {
	const data: Prisma.ReceivingUpdateInput = {};
	if (Object.hasOwn(input, 'discrepancies')) {
		data.discrepancies = input.discrepancies;
	}
	if (Object.hasOwn(input, 'dock')) data.dock = input.dock;
	if (Object.hasOwn(input, 'expectedAt')) {
		data.expectedAt = input.expectedAt ? new Date(input.expectedAt) : undefined;
	}
	if (Object.hasOwn(input, 'invoiceNumber')) {
		data.invoiceNumber = input.invoiceNumber;
	}
	if (Object.hasOwn(input, 'receivedAt')) {
		data.receivedAt = input.receivedAt ? new Date(input.receivedAt) : null;
	}
	if (Object.hasOwn(input, 'receiverName')) {
		data.receiverName = input.receiverName;
	}
	if (Object.hasOwn(input, 'status')) data.status = input.status;
	if (Object.hasOwn(input, 'volumes')) data.volumes = input.volumes;
	return data;
}

function toDomainSupplier(supplier: PrismaSupplierWithResponsibles): Supplier {
	return {
		category: supplier.category as SupplierCategory | undefined,
		createdAt: supplier.createdAt.toISOString(),
		deliveryTerm: supplier.deliveryTerm as SupplierTerm | undefined,
		document: supplier.document ?? undefined,
		email: supplier.email ?? undefined,
		id: supplier.id,
		minimumOrder: supplier.minimumOrder ?? undefined,
		name: supplier.name,
		notes: supplier.notes ?? undefined,
		paymentTerm: supplier.paymentTerm as SupplierTerm | undefined,
		phone: supplier.phone ?? undefined,
		responsibles: supplier.responsibles.map(toDomainSupplierResponsible),
		status: supplier.status as SupplierStatus,
		storeId: supplier.storeId,
		updatedAt: supplier.updatedAt.toISOString(),
		userId: supplier.userId,
	};
}

function toDomainSupplierResponsible(
	responsible: Prisma.SupplierResponsibleGetPayload<object>,
): SupplierResponsible {
	return {
		contactType: responsible.contactType as SupplierResponsibleContactType,
		createdAt: responsible.createdAt.toISOString(),
		email: responsible.email,
		id: responsible.id,
		isPrimary: responsible.isPrimary,
		name: responsible.name,
		phone: responsible.phone,
		role: responsible.role,
		status: responsible.status as SupplierStatus,
		storeId: responsible.storeId,
		supplierId: responsible.supplierId,
		updatedAt: responsible.updatedAt.toISOString(),
		userId: responsible.userId,
	};
}

function toDomainProduct(product: PrismaProductWithImages): Product {
	return {
		barcode: product.barcode ?? undefined,
		costPrice: product.costPrice?.toNumber(),
		createdAt: product.createdAt.toISOString(),
		currentStock: product.currentStock,
		description: product.description ?? undefined,
		id: product.id,
		images: product.images.map(toDomainProductImageAsset),
		inventoryControl: product.inventoryControl as Product['inventoryControl'],
		minimumStock: product.minimumStock,
		name: product.name,
		salePrice: product.salePrice?.toNumber(),
		sku: product.sku,
		status: product.status as ProductStatus,
		storeId: product.storeId,
		supplierId: product.supplierId ?? undefined,
		updatedAt: product.updatedAt.toISOString(),
		userId: product.userId,
	};
}

function toDomainProductImageAsset(
	asset: Prisma.ProductImageAssetGetPayload<object>,
): ProductImageAsset {
	return {
		contentType: 'image/webp',
		createdAt: asset.createdAt.toISOString(),
		fileName: asset.fileName,
		id: asset.id,
		key: asset.key,
		productId: asset.productId,
		publicUrl: asset.publicUrl ?? undefined,
		size: asset.size,
		storeId: asset.storeId,
		userId: asset.userId,
	};
}

function toDomainInventoryMovement(
	movement: Prisma.InventoryMovementGetPayload<object>,
): InventoryMovement {
	return {
		createdAt: movement.createdAt.toISOString(),
		currentStock: movement.currentStock,
		id: movement.id,
		previousStock: movement.previousStock,
		productId: movement.productId,
		quantity: movement.quantity,
		reason: movement.reason,
		storeId: movement.storeId,
		type: movement.type as InventoryAdjustmentType,
		userId: movement.userId,
	};
}

function toDomainPurchaseOrder(
	order: PrismaPurchaseOrderWithItems,
): PurchaseOrder {
	return {
		code: order.code,
		createdAt: order.createdAt.toISOString(),
		expectedDeliveryAt: order.expectedDeliveryAt.toISOString(),
		id: order.id,
		invoiceNumber: order.invoiceNumber ?? undefined,
		items: order.items.map(toDomainPurchaseOrderItem),
		notes: order.notes ?? undefined,
		paymentTerm: order.paymentTerm as SupplierTerm | undefined,
		status: order.status as PurchaseOrderStatus,
		storeId: order.storeId,
		supplierId: order.supplierId,
		totalCost: order.totalCost.toNumber(),
		totalItems: order.totalItems,
		updatedAt: order.updatedAt.toISOString(),
		userId: order.userId,
	};
}

function toDomainPurchaseOrderItem(
	item: Prisma.PurchaseOrderItemGetPayload<object>,
): PurchaseOrderItem {
	return {
		id: item.id,
		name: item.name,
		productId: item.productId ?? undefined,
		purchaseOrderId: item.purchaseOrderId,
		quantity: item.quantity,
		sku: item.sku,
		storeId: item.storeId,
		totalCost: item.totalCost.toNumber(),
		unitCost: item.unitCost.toNumber(),
	};
}

function toDomainReceiving(
	receiving: Prisma.ReceivingGetPayload<object>,
): Receiving {
	return {
		createdAt: receiving.createdAt.toISOString(),
		discrepancies: receiving.discrepancies ?? undefined,
		dock: receiving.dock ?? undefined,
		expectedAt: receiving.expectedAt.toISOString(),
		id: receiving.id,
		invoiceNumber: receiving.invoiceNumber,
		itemsCount: receiving.itemsCount,
		purchaseOrderId: receiving.purchaseOrderId ?? undefined,
		receivedAt: receiving.receivedAt?.toISOString(),
		receiverName: receiving.receiverName ?? undefined,
		status: receiving.status as ReceivingStatus,
		storeId: receiving.storeId,
		supplierId: receiving.supplierId,
		updatedAt: receiving.updatedAt.toISOString(),
		userId: receiving.userId,
		volumes: receiving.volumes,
	};
}
