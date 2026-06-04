import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import type {
	CatalogListQuery,
	CreateInventoryAdjustmentInput,
	CreateProductInput,
	CreateSupplierInput,
	CreateSupplierResponsibleInput,
	InventoryAdjustmentType,
	InventoryMovement,
	PreparedProductImageUpload,
	PrepareProductImageUploadInput,
	Product,
	ProductImageAsset,
	ProductStatus,
	Supplier,
	SupplierCategory,
	SupplierResponsible,
	SupplierResponsibleContactType,
	SupplierStatus,
	SupplierTerm,
	UpdateProductInput,
	UpdateSupplierInput,
	UpdateSupplierResponsibleInput,
} from '../../../domain/entities/catalog';
import type { CatalogRepository } from '../../../domain/repositories/catalog-repository';
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

export class PrismaCatalogRepository implements CatalogRepository {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly r2StorageConfig?: R2StorageConfig,
	) {}

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
				status: 'active',
				userId: input.userId,
			},
			include: { responsibles: true },
		});

		return toDomainSupplier(supplier);
	}

	async findSupplierById(
		userId: string,
		supplierId: string,
	): Promise<Supplier | null> {
		const supplier = await this.prisma.supplier.findFirst({
			where: { id: supplierId, userId },
			include: { responsibles: true },
		});

		return supplier ? toDomainSupplier(supplier) : null;
	}

	async findSupplierByDocument(
		userId: string,
		document: string,
	): Promise<Supplier | null> {
		const supplier = await this.prisma.supplier.findFirst({
			where: { document, userId },
			include: { responsibles: true },
		});

		return supplier ? toDomainSupplier(supplier) : null;
	}

	async listSuppliers(
		userId: string,
		query: CatalogListQuery = {},
	): Promise<Supplier[]> {
		const where: Prisma.SupplierWhereInput = {
			userId,
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

	async updateSupplier(input: UpdateSupplierInput): Promise<Supplier> {
		const supplier = await this.prisma.supplier.findFirst({
			where: { id: input.id, userId: input.userId },
		});
		if (!supplier) {
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

		const updated = await this.prisma.supplier.update({
			where: { id: input.id },
			data: getSupplierUpdateData(input),
			include: { responsibles: true },
		});

		return toDomainSupplier(updated);
	}

	async deleteSupplier(userId: string, supplierId: string): Promise<void> {
		const supplier = await this.prisma.supplier.findFirst({
			where: { id: supplierId, userId },
		});
		if (!supplier) {
			throw new NotFoundError('Fornecedor não encontrado.');
		}

		await this.prisma.supplier.delete({ where: { id: supplierId } });
	}

	async createSupplierResponsible(
		input: CreateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input.userId, input.supplierId);

		const responsible = await this.prisma.$transaction(async (tx) => {
			if (input.isPrimary) {
				await tx.supplierResponsible.updateMany({
					where: { supplierId: input.supplierId, userId: input.userId },
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
					supplierId: input.supplierId,
					userId: input.userId,
				},
			});
		});

		return toDomainSupplierResponsible(responsible);
	}

	async deleteSupplierResponsible(
		userId: string,
		supplierId: string,
		responsibleId: string,
	): Promise<void> {
		await this.ensureSupplier(userId, supplierId);
		const responsible = await this.prisma.supplierResponsible.findFirst({
			where: { id: responsibleId, supplierId, userId },
		});
		if (!responsible) {
			throw new NotFoundError('Responsável não encontrado.');
		}

		await this.prisma.supplierResponsible.delete({
			where: { id: responsibleId },
		});
	}

	async listSupplierResponsibles(
		userId: string,
		supplierId: string,
	): Promise<SupplierResponsible[]> {
		await this.ensureSupplier(userId, supplierId);
		const responsibles = await this.prisma.supplierResponsible.findMany({
			where: { supplierId, userId },
			orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
		});

		return responsibles.map(toDomainSupplierResponsible);
	}

	async updateSupplierResponsible(
		input: UpdateSupplierResponsibleInput,
	): Promise<SupplierResponsible> {
		await this.ensureSupplier(input.userId, input.supplierId);
		const responsible = await this.prisma.supplierResponsible.findFirst({
			where: {
				id: input.id,
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
					where: { supplierId: input.supplierId, userId: input.userId },
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
		const existing = await this.findProductBySku(input.userId, input.sku);
		if (existing) {
			throw new DomainError('Produto com este SKU já existe.');
		}

		if (input.supplierId) {
			await this.ensureSupplier(input.userId, input.supplierId);
		}

		const product = await this.prisma.product.create({
			data: {
				costPrice: input.costPrice,
				currentStock: input.currentStock ?? 0,
				description: input.description,
				minimumStock: input.minimumStock ?? 0,
				name: input.name,
				salePrice: input.salePrice,
				sku: input.sku,
				status: 'active',
				supplierId: input.supplierId,
				userId: input.userId,
			},
			include: { images: true },
		});

		return toDomainProduct(product);
	}

	async findProductById(
		userId: string,
		productId: string,
	): Promise<Product | null> {
		const product = await this.prisma.product.findFirst({
			where: { id: productId, userId },
			include: { images: true },
		});

		return product ? toDomainProduct(product) : null;
	}

	async findProductBySku(userId: string, sku: string): Promise<Product | null> {
		const product = await this.prisma.product.findFirst({
			where: { sku, userId },
			include: { images: true },
		});

		return product ? toDomainProduct(product) : null;
	}

	async listProducts(
		userId: string,
		query: CatalogListQuery = {},
	): Promise<Product[]> {
		const where: Prisma.ProductWhereInput = {
			userId,
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
			where: { id: input.id, userId: input.userId },
		});
		if (!product) {
			throw new NotFoundError('Produto não encontrado.');
		}

		if (input.sku && input.sku !== product.sku) {
			const existing = await this.findProductBySku(input.userId, input.sku);
			if (existing) {
				throw new DomainError('Produto com este SKU já existe.');
			}
		}

		if (input.supplierId) {
			await this.ensureSupplier(input.userId, input.supplierId);
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
				where: { id: input.productId, userId: input.userId },
			});
			if (!product) {
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
					type: input.type,
					userId: input.userId,
				},
			});
		});

		return toDomainInventoryMovement(movement);
	}

	async listInventoryMovements(
		userId: string,
		productId?: string,
	): Promise<InventoryMovement[]> {
		const movements = await this.prisma.inventoryMovement.findMany({
			where: { userId, ...(productId ? { productId } : {}) },
			orderBy: { createdAt: 'desc' },
		});

		return movements.map(toDomainInventoryMovement);
	}

	async prepareProductImageUpload(
		input: PrepareProductImageUploadInput,
	): Promise<PreparedProductImageUpload> {
		const product = await this.prisma.product.findFirst({
			where: { id: input.productId, userId: input.userId },
		});
		if (!product) {
			throw new NotFoundError('Produto não encontrado.');
		}

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

		const asset = await this.prisma.productImageAsset.create({
			data: {
				contentType: input.contentType,
				fileName: input.fileName,
				key,
				productId: input.productId,
				publicUrl: upload.publicUrl,
				size: input.size,
				userId: input.userId,
			},
		});

		return {
			asset: toDomainProductImageAsset(asset),
			upload,
		};
	}

	private async ensureSupplier(userId: string, supplierId: string) {
		const supplier = await this.prisma.supplier.findFirst({
			where: { id: supplierId, userId },
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
			{ description: { contains: search, mode: Prisma.QueryMode.insensitive } },
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
	if (Object.hasOwn(input, 'costPrice')) data.costPrice = input.costPrice;
	if (Object.hasOwn(input, 'currentStock')) {
		data.currentStock = input.currentStock;
	}
	if (Object.hasOwn(input, 'description')) data.description = input.description;
	if (Object.hasOwn(input, 'minimumStock')) {
		data.minimumStock = input.minimumStock;
	}
	if (Object.hasOwn(input, 'name')) data.name = input.name;
	if (Object.hasOwn(input, 'salePrice')) data.salePrice = input.salePrice;
	if (Object.hasOwn(input, 'sku')) data.sku = input.sku;
	if (Object.hasOwn(input, 'status')) data.status = input.status;
	if (Object.hasOwn(input, 'supplierId')) {
		data.supplier = input.supplierId
			? { connect: { id: input.supplierId } }
			: { disconnect: true };
	}
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
		supplierId: responsible.supplierId,
		updatedAt: responsible.updatedAt.toISOString(),
		userId: responsible.userId,
	};
}

function toDomainProduct(product: PrismaProductWithImages): Product {
	return {
		costPrice: product.costPrice ?? undefined,
		createdAt: product.createdAt.toISOString(),
		currentStock: product.currentStock,
		description: product.description ?? undefined,
		id: product.id,
		images: product.images.map(toDomainProductImageAsset),
		minimumStock: product.minimumStock,
		name: product.name,
		salePrice: product.salePrice ?? undefined,
		sku: product.sku,
		status: product.status as ProductStatus,
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
		type: movement.type as InventoryAdjustmentType,
		userId: movement.userId,
	};
}
