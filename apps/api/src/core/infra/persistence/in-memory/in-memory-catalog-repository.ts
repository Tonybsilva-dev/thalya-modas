import { randomUUID } from 'node:crypto';
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
	InventoryMovement,
	PreparedProductImageUpload,
	PrepareProductImageUploadInput,
	Product,
	PurchaseOrder,
	PurchaseOrderItem,
	Receiving,
	Supplier,
	SupplierOperationalSummary,
	SupplierResponsible,
	UpdateProductInput,
	UpdatePurchaseOrderInput,
	UpdateReceivingInput,
	UpdateSupplierInput,
	UpdateSupplierResponsibleInput,
} from '../../../domain/entities/catalog';
import type { CatalogRepository } from '../../../domain/repositories/catalog-repository';
import {
	createR2PresignedUpload,
	type R2StorageConfig,
} from '../../storage/r2-presigned-upload';

export class InMemoryCatalogRepository implements CatalogRepository {
	private readonly movements = new Map<string, InventoryMovement>();
	private readonly products = new Map<string, Product>();
	private readonly purchaseOrders = new Map<string, PurchaseOrder>();
	private readonly receivings = new Map<string, Receiving>();
	private readonly responsibles = new Map<string, SupplierResponsible>();
	private readonly suppliers = new Map<string, Supplier>();

	constructor(private readonly r2StorageConfig?: R2StorageConfig) {}

	async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
		if (input.document) {
			const existing = await this.findSupplierByDocument(input, input.document);
			if (existing) {
				throw new DomainError('Fornecedor com este documento já existe.');
			}
		}

		const now = new Date().toISOString();
		const supplier: Supplier = {
			createdAt: now,
			document: input.document,
			category: input.category,
			deliveryTerm: input.deliveryTerm,
			email: input.email,
			id: randomUUID(),
			minimumOrder: input.minimumOrder,
			name: input.name,
			notes: input.notes,
			paymentTerm: input.paymentTerm,
			phone: input.phone,
			responsibles: [],
			status: input.status ?? 'active',
			storeId: input.storeId,
			updatedAt: now,
			userId: input.userId,
		};

		this.suppliers.set(supplier.id, supplier);
		return clone(supplier);
	}

	async findSupplierById(
		scope: CatalogScope,
		supplierId: string,
	): Promise<Supplier | null> {
		const supplier = this.suppliers.get(supplierId);
		return supplier?.userId === scope.userId &&
			supplier.storeId === scope.storeId
			? this.hydrateSupplier(supplier)
			: null;
	}

	async findSupplierByDocument(
		scope: CatalogScope,
		document: string,
	): Promise<Supplier | null> {
		const supplier = Array.from(this.suppliers.values()).find(
			(item) => item.storeId === scope.storeId && item.document === document,
		);
		return supplier ? clone(supplier) : null;
	}

	async listSuppliers(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<Supplier[]> {
		return filterAndPaginate(
			Array.from(this.suppliers.values()).filter(
				(item) =>
					item.userId === scope.userId && item.storeId === scope.storeId,
			),
			query,
			(item) => [
				item.name,
				item.document,
				item.email,
				item.phone,
				item.category,
			],
		).map((supplier) => this.hydrateSupplier(supplier));
	}

	async getSupplierOperationalSummary(
		scope: CatalogScope,
	): Promise<SupplierOperationalSummary> {
		const suppliers = Array.from(this.suppliers.values()).filter(
			(supplier) =>
				supplier.userId === scope.userId && supplier.storeId === scope.storeId,
		);
		const supplierIdsWithResponsible = new Set(
			Array.from(this.responsibles.values())
				.filter(
					(responsible) =>
						responsible.userId === scope.userId &&
						responsible.storeId === scope.storeId,
				)
				.map((responsible) => responsible.supplierId),
		);
		const orders = Array.from(this.purchaseOrders.values()).filter(
			(order) =>
				order.userId === scope.userId && order.storeId === scope.storeId,
		);
		const receivings = Array.from(this.receivings.values()).filter(
			(receiving) =>
				receiving.userId === scope.userId &&
				receiving.storeId === scope.storeId,
		);
		const openOrders = orders.filter(
			(order) => !['completed', 'cancelled'].includes(order.status),
		);

		return {
			activeSuppliers: suppliers.filter(
				(supplier) => supplier.status === 'active',
			).length,
			delayedOrders: orders.filter((order) => order.status === 'delayed')
				.length,
			delayedReceivings: receivings.filter(
				(receiving) => receiving.status === 'delayed',
			).length,
			dueReceivings: receivings.filter((receiving) =>
				['scheduled', 'checking', 'delayed'].includes(receiving.status),
			).length,
			openOrderValue: openOrders.reduce(
				(total, order) => total + order.totalCost,
				0,
			),
			openOrders: openOrders.length,
			suppliersWithResponsible: suppliers.filter((supplier) =>
				supplierIdsWithResponsible.has(supplier.id),
			).length,
			totalSuppliers: suppliers.length,
		};
	}

	async updateSupplier(input: UpdateSupplierInput): Promise<Supplier> {
		const supplier = this.suppliers.get(input.id);
		if (
			!supplier ||
			supplier.userId !== input.userId ||
			supplier.storeId !== input.storeId
		) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		if (input.document && input.document !== supplier.document) {
			const existing = await this.findSupplierByDocument(input, input.document);
			if (existing) {
				throw new DomainError('Fornecedor com este documento já existe.');
			}
		}

		const updated: Supplier = {
			...supplier,
			category: input.category ?? supplier.category,
			deliveryTerm: input.deliveryTerm ?? supplier.deliveryTerm,
			document: input.document ?? supplier.document,
			email: input.email ?? supplier.email,
			minimumOrder: input.minimumOrder ?? supplier.minimumOrder,
			name: input.name ?? supplier.name,
			notes: input.notes ?? supplier.notes,
			paymentTerm: input.paymentTerm ?? supplier.paymentTerm,
			phone: input.phone ?? supplier.phone,
			status: input.status ?? supplier.status,
			updatedAt: new Date().toISOString(),
		};

		this.suppliers.set(updated.id, updated);
		return this.hydrateSupplier(updated);
	}

	async deleteSupplier(scope: CatalogScope, supplierId: string): Promise<void> {
		const supplier = this.suppliers.get(supplierId);
		if (
			!supplier ||
			supplier.userId !== scope.userId ||
			supplier.storeId !== scope.storeId
		) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}
		const hasPurchaseOrder = Array.from(this.purchaseOrders.values()).some(
			(order) =>
				order.supplierId === supplierId &&
				order.userId === scope.userId &&
				order.storeId === scope.storeId,
		);
		const hasReceiving = Array.from(this.receivings.values()).some(
			(receiving) =>
				receiving.supplierId === supplierId &&
				receiving.userId === scope.userId &&
				receiving.storeId === scope.storeId,
		);
		if (hasPurchaseOrder || hasReceiving) {
			throw new DomainError(
				'Fornecedor possui pedidos ou recebimentos e não pode ser excluído. Inative o cadastro para preservar o histórico.',
			);
		}

		this.suppliers.delete(supplierId);
		for (const responsible of this.responsibles.values()) {
			if (
				responsible.supplierId === supplierId &&
				responsible.userId === scope.userId &&
				responsible.storeId === scope.storeId
			) {
				this.responsibles.delete(responsible.id);
			}
		}
	}

	async createSupplierResponsible(
		input: CreateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input, input.supplierId);
		const now = new Date().toISOString();
		const responsible: SupplierResponsible = {
			contactType: input.contactType,
			createdAt: now,
			email: input.email,
			id: randomUUID(),
			isPrimary: input.isPrimary,
			name: input.name,
			phone: input.phone,
			role: input.role,
			status: input.status,
			storeId: input.storeId,
			supplierId: input.supplierId,
			updatedAt: now,
			userId: input.userId,
		};

		this.saveResponsible(responsible);
		return clone(responsible);
	}

	async deleteSupplierResponsible(
		scope: CatalogScope,
		supplierId: string,
		responsibleId: string,
	): Promise<void> {
		await this.ensureSupplier(scope, supplierId);
		const responsible = this.responsibles.get(responsibleId);
		if (
			!responsible ||
			responsible.userId !== scope.userId ||
			responsible.storeId !== scope.storeId ||
			responsible.supplierId !== supplierId
		) {
			throw new NotFoundError('Responsável não encontrado.');
		}

		this.responsibles.delete(responsibleId);
	}

	async listSupplierResponsibles(
		scope: CatalogScope,
		supplierId: string,
	): Promise<SupplierResponsible[]> {
		await this.ensureSupplier(scope, supplierId);
		return Array.from(this.responsibles.values())
			.filter(
				(item) =>
					item.userId === scope.userId &&
					item.storeId === scope.storeId &&
					item.supplierId === supplierId,
			)
			.map(clone);
	}

	async updateSupplierResponsible(
		input: UpdateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input, input.supplierId);
		const responsible = this.responsibles.get(input.id);
		if (
			!responsible ||
			responsible.userId !== input.userId ||
			responsible.storeId !== input.storeId ||
			responsible.supplierId !== input.supplierId
		) {
			throw new NotFoundError('Responsável não encontrado.');
		}

		const updated: SupplierResponsible = {
			...responsible,
			contactType: input.contactType ?? responsible.contactType,
			email: input.email ?? responsible.email,
			isPrimary: input.isPrimary ?? responsible.isPrimary,
			name: input.name ?? responsible.name,
			phone: input.phone ?? responsible.phone,
			role: input.role ?? responsible.role,
			status: input.status ?? responsible.status,
			updatedAt: new Date().toISOString(),
		};

		this.saveResponsible(updated);
		return clone(updated);
	}

	async createProduct(input: CreateProductInput): Promise<Product> {
		const existing = await this.findProductBySku(input, input.sku);
		if (existing) {
			throw new DomainError('Produto com este SKU já existe.');
		}

		if (input.supplierId) {
			const supplier = await this.findSupplierById(input, input.supplierId);
			if (!supplier) {
				throw new NotFoundError('Fornecedor não encontrado.');
			}
		}

		const now = new Date().toISOString();
		const product: Product = {
			costPrice: input.costPrice,
			createdAt: now,
			currentStock: input.currentStock ?? 0,
			description: input.description,
			id: randomUUID(),
			images: [],
			minimumStock: input.minimumStock ?? 0,
			name: input.name,
			salePrice: input.salePrice,
			sku: input.sku,
			status: 'active',
			storeId: input.storeId,
			supplierId: input.supplierId,
			updatedAt: now,
			userId: input.userId,
		};

		this.products.set(product.id, product);
		return clone(product);
	}

	async findProductById(
		scope: CatalogScope,
		productId: string,
	): Promise<Product | null> {
		const product = this.products.get(productId);
		return product?.userId === scope.userId && product.storeId === scope.storeId
			? clone(product)
			: null;
	}

	async findProductBySku(
		scope: CatalogScope,
		sku: string,
	): Promise<Product | null> {
		const product = Array.from(this.products.values()).find(
			(item) => item.storeId === scope.storeId && item.sku === sku,
		);
		return product ? clone(product) : null;
	}

	async listProducts(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<Product[]> {
		return filterAndPaginate(
			Array.from(this.products.values()).filter(
				(item) =>
					item.userId === scope.userId && item.storeId === scope.storeId,
			),
			query,
			(item) => [item.name, item.sku, item.description],
		).map(clone);
	}

	async updateProduct(input: UpdateProductInput): Promise<Product> {
		const product = this.products.get(input.id);
		if (
			!product ||
			product.userId !== input.userId ||
			product.storeId !== input.storeId
		) {
			throw new NotFoundError('Produto não encontrado.');
		}

		if (input.sku && input.sku !== product.sku) {
			const existing = await this.findProductBySku(input, input.sku);
			if (existing) {
				throw new DomainError('Produto com este SKU já existe.');
			}
		}

		if (input.supplierId) {
			const supplier = await this.findSupplierById(input, input.supplierId);
			if (!supplier) {
				throw new NotFoundError('Fornecedor não encontrado.');
			}
		}

		const updated: Product = {
			...product,
			costPrice: input.costPrice ?? product.costPrice,
			currentStock: input.currentStock ?? product.currentStock,
			description: input.description ?? product.description,
			minimumStock: input.minimumStock ?? product.minimumStock,
			name: input.name ?? product.name,
			salePrice: input.salePrice ?? product.salePrice,
			sku: input.sku ?? product.sku,
			status: input.status ?? product.status,
			supplierId: input.supplierId ?? product.supplierId,
			updatedAt: new Date().toISOString(),
		};

		this.products.set(updated.id, updated);
		return clone(updated);
	}

	async createInventoryAdjustment(
		input: CreateInventoryAdjustmentInput,
	): Promise<InventoryMovement> {
		const product = this.products.get(input.productId);
		if (
			!product ||
			product.userId !== input.userId ||
			product.storeId !== input.storeId
		) {
			throw new NotFoundError('Produto não encontrado.');
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

		const movement: InventoryMovement = {
			createdAt: new Date().toISOString(),
			currentStock,
			id: randomUUID(),
			previousStock,
			productId: product.id,
			quantity: input.quantity,
			reason: input.reason,
			storeId: input.storeId,
			type: input.type,
			userId: input.userId,
		};

		this.movements.set(movement.id, movement);
		this.products.set(product.id, {
			...product,
			currentStock,
			updatedAt: movement.createdAt,
		});

		return clone(movement);
	}

	async listInventoryMovements(
		scope: CatalogScope,
		productId?: string,
	): Promise<InventoryMovement[]> {
		return Array.from(this.movements.values())
			.filter(
				(item) =>
					item.userId === scope.userId &&
					item.storeId === scope.storeId &&
					(!productId || item.productId === productId),
			)
			.map(clone);
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

		const now = new Date().toISOString();
		const id = randomUUID();
		const items = input.items.map(
			(item): PurchaseOrderItem => ({
				id: randomUUID(),
				name: item.name,
				productId: item.productId,
				purchaseOrderId: id,
				quantity: item.quantity,
				sku: item.sku,
				storeId: input.storeId,
				totalCost: item.quantity * item.unitCost,
				unitCost: item.unitCost,
			}),
		);
		const order: PurchaseOrder = {
			code: `PO-${String(this.purchaseOrders.size + 1).padStart(4, '0')}`,
			createdAt: now,
			expectedDeliveryAt: input.expectedDeliveryAt,
			id,
			invoiceNumber: input.invoiceNumber,
			items,
			notes: input.notes,
			paymentTerm: input.paymentTerm,
			status: input.status ?? 'confirmed',
			storeId: input.storeId,
			supplierId: input.supplierId,
			totalCost: items.reduce((total, item) => total + item.totalCost, 0),
			totalItems: items.reduce((total, item) => total + item.quantity, 0),
			updatedAt: now,
			userId: input.userId,
		};

		this.purchaseOrders.set(order.id, order);
		return clone(order);
	}

	async listPurchaseOrders(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<PurchaseOrder[]> {
		return filterAndPaginate(
			Array.from(this.purchaseOrders.values()).filter(
				(item) =>
					item.userId === scope.userId &&
					item.storeId === scope.storeId &&
					(!query.supplierId || item.supplierId === query.supplierId),
			),
			query,
			(item) => [item.code, item.invoiceNumber, item.status],
		).map(clone);
	}

	async updatePurchaseOrder(
		input: UpdatePurchaseOrderInput,
	): Promise<PurchaseOrder> {
		const order = this.purchaseOrders.get(input.id);
		if (
			!order ||
			order.userId !== input.userId ||
			order.storeId !== input.storeId
		) {
			throw new NotFoundError('Pedido de compra não encontrado.');
		}

		const updated: PurchaseOrder = {
			...order,
			expectedDeliveryAt: input.expectedDeliveryAt ?? order.expectedDeliveryAt,
			invoiceNumber: input.invoiceNumber ?? order.invoiceNumber,
			notes: input.notes ?? order.notes,
			paymentTerm: input.paymentTerm ?? order.paymentTerm,
			status: input.status ?? order.status,
			updatedAt: new Date().toISOString(),
		};

		this.purchaseOrders.set(updated.id, updated);
		return clone(updated);
	}

	async createReceiving(input: CreateReceivingInput): Promise<Receiving> {
		await this.ensureSupplier(input, input.supplierId);

		let itemsCount = 0;
		if (input.purchaseOrderId) {
			const order = this.purchaseOrders.get(input.purchaseOrderId);
			if (
				!order ||
				order.userId !== input.userId ||
				order.storeId !== input.storeId
			) {
				throw new NotFoundError('Pedido de compra não encontrado.');
			}
			itemsCount = order.totalItems;
		}

		const now = new Date().toISOString();
		const receiving: Receiving = {
			createdAt: now,
			discrepancies: input.discrepancies,
			dock: input.dock,
			expectedAt: input.expectedAt,
			id: randomUUID(),
			invoiceNumber: input.invoiceNumber,
			itemsCount,
			purchaseOrderId: input.purchaseOrderId,
			receivedAt: input.receivedAt,
			receiverName: input.receiverName,
			status: input.status ?? 'scheduled',
			storeId: input.storeId,
			supplierId: input.supplierId,
			updatedAt: now,
			userId: input.userId,
			volumes: input.volumes,
		};

		this.receivings.set(receiving.id, receiving);
		return clone(receiving);
	}

	async listReceivings(
		scope: CatalogScope,
		query: CatalogListQuery = {},
	): Promise<Receiving[]> {
		return filterAndPaginate(
			Array.from(this.receivings.values()).filter(
				(item) =>
					item.userId === scope.userId &&
					item.storeId === scope.storeId &&
					(!query.supplierId || item.supplierId === query.supplierId),
			),
			query,
			(item) => [item.invoiceNumber, item.status, item.dock, item.receiverName],
		).map(clone);
	}

	async updateReceiving(input: UpdateReceivingInput): Promise<Receiving> {
		const receiving = this.receivings.get(input.id);
		if (
			!receiving ||
			receiving.userId !== input.userId ||
			receiving.storeId !== input.storeId
		) {
			throw new NotFoundError('Recebimento não encontrado.');
		}

		const updated: Receiving = {
			...receiving,
			discrepancies: input.discrepancies ?? receiving.discrepancies,
			dock: input.dock ?? receiving.dock,
			expectedAt: input.expectedAt ?? receiving.expectedAt,
			invoiceNumber: input.invoiceNumber ?? receiving.invoiceNumber,
			receivedAt: input.receivedAt ?? receiving.receivedAt,
			receiverName: input.receiverName ?? receiving.receiverName,
			status: input.status ?? receiving.status,
			updatedAt: new Date().toISOString(),
			volumes: input.volumes ?? receiving.volumes,
		};

		this.receivings.set(updated.id, updated);
		return clone(updated);
	}

	async prepareProductImageUpload(
		input: PrepareProductImageUploadInput,
	): Promise<PreparedProductImageUpload> {
		const product = this.products.get(input.productId);
		if (
			!product ||
			product.userId !== input.userId ||
			product.storeId !== input.storeId
		) {
			throw new NotFoundError('Produto não encontrado.');
		}

		const createdAt = new Date().toISOString();
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
		const asset = {
			contentType: input.contentType,
			createdAt,
			fileName: input.fileName,
			id: randomUUID(),
			key,
			productId: input.productId,
			publicUrl: upload.publicUrl,
			size: input.size,
			storeId: input.storeId,
			userId: input.userId,
		} as const;

		this.products.set(product.id, {
			...product,
			images: [...product.images, asset],
			updatedAt: createdAt,
		});

		return {
			asset: clone(asset),
			upload,
		};
	}

	private async ensureSupplier(scope: CatalogScope, supplierId: string) {
		const supplier = await this.findSupplierById(scope, supplierId);
		if (!supplier) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		return supplier;
	}

	private hydrateSupplier(supplier: Supplier): Supplier {
		return clone({
			...supplier,
			responsibles: Array.from(this.responsibles.values()).filter(
				(item) =>
					item.userId === supplier.userId &&
					item.storeId === supplier.storeId &&
					item.supplierId === supplier.id,
			),
		});
	}

	private saveResponsible(responsible: SupplierResponsible) {
		if (responsible.isPrimary) {
			for (const item of this.responsibles.values()) {
				if (
					item.userId === responsible.userId &&
					item.storeId === responsible.storeId &&
					item.supplierId === responsible.supplierId
				) {
					this.responsibles.set(item.id, { ...item, isPrimary: false });
				}
			}
		}

		this.responsibles.set(responsible.id, responsible);
	}
}

function filterAndPaginate<T>(
	items: T[],
	query: CatalogListQuery,
	getSearchFields: (item: T) => Array<string | undefined>,
) {
	const q = query.q?.trim().toLowerCase();
	const status = query.status?.trim();
	const page = query.page ?? 1;
	const perPage = query.perPage ?? 20;
	const filtered = items.filter((item) => {
		const matchesSearch =
			!q ||
			getSearchFields(item).some((field) => field?.toLowerCase().includes(q));
		const matchesStatus =
			!status ||
			status === 'all' ||
			('status' in (item as object) &&
				(item as { status?: string }).status === status);
		return matchesSearch && matchesStatus;
	});

	return filtered.slice((page - 1) * perPage, page * perPage);
}

function clone<T>(value: T): T {
	return structuredClone(value);
}
