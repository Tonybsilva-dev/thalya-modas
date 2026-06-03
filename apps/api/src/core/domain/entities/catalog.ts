export type SupplierStatus = 'active' | 'inactive';
export type SupplierCategory =
	| 'women_fashion'
	| 'accessories'
	| 'footwear'
	| 'mens_fashion'
	| 'packaging';
export type SupplierTerm = '+3' | '+5' | '+7' | '+15' | '+30' | '+45';
export type SupplierResponsibleContactType = 'orders' | 'delivery' | 'financial';

export type ProductStatus = 'active' | 'inactive';

export type InventoryAdjustmentType = 'in' | 'out' | 'correction';

export type Supplier = {
	id: string;
	userId: string;
	name: string;
	category?: SupplierCategory;
	document?: string;
	deliveryTerm?: SupplierTerm;
	email?: string;
	minimumOrder?: string;
	notes?: string;
	paymentTerm?: SupplierTerm;
	phone?: string;
	responsibles: SupplierResponsible[];
	status: SupplierStatus;
	createdAt: string;
	updatedAt: string;
};

export type SupplierResponsible = {
	id: string;
	supplierId: string;
	userId: string;
	name: string;
	role: string;
	phone: string;
	email: string;
	contactType: SupplierResponsibleContactType;
	isPrimary: boolean;
	status: SupplierStatus;
	createdAt: string;
	updatedAt: string;
};

export type ProductImageAsset = {
	id: string;
	productId: string;
	userId: string;
	fileName: string;
	contentType: 'image/webp';
	key: string;
	publicUrl?: string;
	size: number;
	createdAt: string;
};

export type Product = {
	id: string;
	userId: string;
	name: string;
	sku: string;
	description?: string;
	supplierId?: string;
	costPrice?: number;
	salePrice?: number;
	currentStock: number;
	minimumStock: number;
	status: ProductStatus;
	images: ProductImageAsset[];
	createdAt: string;
	updatedAt: string;
};

export type InventoryMovement = {
	id: string;
	userId: string;
	productId: string;
	type: InventoryAdjustmentType;
	quantity: number;
	previousStock: number;
	currentStock: number;
	reason: string;
	createdAt: string;
};

export type CreateSupplierInput = {
	userId: string;
	name: string;
	category?: SupplierCategory;
	document?: string;
	deliveryTerm?: SupplierTerm;
	email?: string;
	minimumOrder?: string;
	notes?: string;
	paymentTerm?: SupplierTerm;
	phone?: string;
};

export type UpdateSupplierInput = Partial<
	Omit<CreateSupplierInput, 'userId'>
> & {
	id: string;
	userId: string;
	status?: SupplierStatus;
};

export type CreateSupplierResponsibleInput = {
	userId: string;
	supplierId: string;
	name: string;
	role: string;
	phone: string;
	email: string;
	contactType: SupplierResponsibleContactType;
	isPrimary: boolean;
	status: SupplierStatus;
};

export type UpdateSupplierResponsibleInput = Partial<
	Omit<CreateSupplierResponsibleInput, 'userId' | 'supplierId'>
> & {
	id: string;
	userId: string;
	supplierId: string;
};

export type CreateProductInput = {
	userId: string;
	name: string;
	sku: string;
	description?: string;
	supplierId?: string;
	costPrice?: number;
	salePrice?: number;
	currentStock?: number;
	minimumStock?: number;
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'userId'>> & {
	id: string;
	userId: string;
	status?: ProductStatus;
};

export type CreateInventoryAdjustmentInput = {
	userId: string;
	productId: string;
	type: InventoryAdjustmentType;
	quantity: number;
	reason: string;
};

export type PrepareProductImageUploadInput = {
	userId: string;
	productId: string;
	fileName: string;
	contentType: 'image/webp';
	size: number;
};

export type PreparedProductImageUpload = {
	asset: ProductImageAsset;
	upload: {
		method: 'PUT';
		url: string;
		headers: Record<string, string>;
		key: string;
	};
};

export type CatalogListQuery = {
	q?: string;
	status?: string;
	page?: number;
	perPage?: number;
};
