import { randomUUID } from 'node:crypto';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import type {
	CatalogListQuery,
	CreateInventoryAdjustmentInput,
	CreateProductInput,
	CreateSupplierInput,
	CreateSupplierResponsibleInput,
	InventoryMovement,
	PreparedProductImageUpload,
	PrepareProductImageUploadInput,
	Product,
	Supplier,
	SupplierResponsible,
	UpdateProductInput,
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
	private readonly responsibles = new Map<string, SupplierResponsible>();
	private readonly suppliers = new Map<string, Supplier>();

	constructor(private readonly r2StorageConfig?: R2StorageConfig) {}

	async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
		if (input.document) {
			const existing = await this.findSupplierByDocument(
				input.userId,
				input.document,
			);
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
			status: 'active',
			updatedAt: now,
			userId: input.userId,
		};

		this.suppliers.set(supplier.id, supplier);
		return clone(supplier);
	}

	async findSupplierById(
		userId: string,
		supplierId: string,
	): Promise<Supplier | null> {
		const supplier = this.suppliers.get(supplierId);
		return supplier?.userId === userId ? this.hydrateSupplier(supplier) : null;
	}

	async findSupplierByDocument(
		userId: string,
		document: string,
	): Promise<Supplier | null> {
		const supplier = Array.from(this.suppliers.values()).find(
			(item) => item.userId === userId && item.document === document,
		);
		return supplier ? clone(supplier) : null;
	}

	async listSuppliers(
		userId: string,
		query: CatalogListQuery = {},
	): Promise<Supplier[]> {
		return filterAndPaginate(
			Array.from(this.suppliers.values()).filter(
				(item) => item.userId === userId,
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

	async updateSupplier(input: UpdateSupplierInput): Promise<Supplier> {
		const supplier = this.suppliers.get(input.id);
		if (!supplier || supplier.userId !== input.userId) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		if (input.document && input.document !== supplier.document) {
			const existing = await this.findSupplierByDocument(
				input.userId,
				input.document,
			);
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

	async deleteSupplier(userId: string, supplierId: string): Promise<void> {
		const supplier = this.suppliers.get(supplierId);
		if (!supplier || supplier.userId !== userId) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		this.suppliers.delete(supplierId);
		for (const responsible of this.responsibles.values()) {
			if (
				responsible.supplierId === supplierId &&
				responsible.userId === userId
			) {
				this.responsibles.delete(responsible.id);
			}
		}
	}

	async createSupplierResponsible(
		input: CreateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input.userId, input.supplierId);
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
			supplierId: input.supplierId,
			updatedAt: now,
			userId: input.userId,
		};

		this.saveResponsible(responsible);
		return clone(responsible);
	}

	async deleteSupplierResponsible(
		userId: string,
		supplierId: string,
		responsibleId: string,
	): Promise<void> {
		await this.ensureSupplier(userId, supplierId);
		const responsible = this.responsibles.get(responsibleId);
		if (
			!responsible ||
			responsible.userId !== userId ||
			responsible.supplierId !== supplierId
		) {
			throw new NotFoundError('Responsável não encontrado.');
		}

		this.responsibles.delete(responsibleId);
	}

	async listSupplierResponsibles(
		userId: string,
		supplierId: string,
	): Promise<SupplierResponsible[]> {
		await this.ensureSupplier(userId, supplierId);
		return Array.from(this.responsibles.values())
			.filter(
				(item) => item.userId === userId && item.supplierId === supplierId,
			)
			.map(clone);
	}

	async updateSupplierResponsible(
		input: UpdateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input.userId, input.supplierId);
		const responsible = this.responsibles.get(input.id);
		if (
			!responsible ||
			responsible.userId !== input.userId ||
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
		const existing = await this.findProductBySku(input.userId, input.sku);
		if (existing) {
			throw new DomainError('Produto com este SKU já existe.');
		}

		if (input.supplierId) {
			const supplier = await this.findSupplierById(
				input.userId,
				input.supplierId,
			);
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
			supplierId: input.supplierId,
			updatedAt: now,
			userId: input.userId,
		};

		this.products.set(product.id, product);
		return clone(product);
	}

	async findProductById(
		userId: string,
		productId: string,
	): Promise<Product | null> {
		const product = this.products.get(productId);
		return product?.userId === userId ? clone(product) : null;
	}

	async findProductBySku(userId: string, sku: string): Promise<Product | null> {
		const product = Array.from(this.products.values()).find(
			(item) => item.userId === userId && item.sku === sku,
		);
		return product ? clone(product) : null;
	}

	async listProducts(
		userId: string,
		query: CatalogListQuery = {},
	): Promise<Product[]> {
		return filterAndPaginate(
			Array.from(this.products.values()).filter(
				(item) => item.userId === userId,
			),
			query,
			(item) => [item.name, item.sku, item.description],
		).map(clone);
	}

	async updateProduct(input: UpdateProductInput): Promise<Product> {
		const product = this.products.get(input.id);
		if (!product || product.userId !== input.userId) {
			throw new NotFoundError('Produto não encontrado.');
		}

		if (input.sku && input.sku !== product.sku) {
			const existing = await this.findProductBySku(input.userId, input.sku);
			if (existing) {
				throw new DomainError('Produto com este SKU já existe.');
			}
		}

		if (input.supplierId) {
			const supplier = await this.findSupplierById(
				input.userId,
				input.supplierId,
			);
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
		if (!product || product.userId !== input.userId) {
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
		userId: string,
		productId?: string,
	): Promise<InventoryMovement[]> {
		return Array.from(this.movements.values())
			.filter(
				(item) =>
					item.userId === userId &&
					(!productId || item.productId === productId),
			)
			.map(clone);
	}

	async prepareProductImageUpload(
		input: PrepareProductImageUploadInput,
	): Promise<PreparedProductImageUpload> {
		const product = this.products.get(input.productId);
		if (!product || product.userId !== input.userId) {
			throw new NotFoundError('Produto não encontrado.');
		}

		const createdAt = new Date().toISOString();
		const key = `products/${input.userId}/${input.productId}/${randomUUID()}.webp`;
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

	private async ensureSupplier(userId: string, supplierId: string) {
		const supplier = await this.findSupplierById(userId, supplierId);
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
					item.userId === supplier.userId && item.supplierId === supplier.id,
			),
		});
	}

	private saveResponsible(responsible: SupplierResponsible) {
		if (responsible.isPrimary) {
			for (const item of this.responsibles.values()) {
				if (
					item.userId === responsible.userId &&
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
