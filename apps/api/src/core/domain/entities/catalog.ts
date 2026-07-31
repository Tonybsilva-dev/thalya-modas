export type SupplierStatus = 'active' | 'inactive';
export type SupplierCategory =
	| 'women_fashion'
	| 'accessories'
	| 'footwear'
	| 'mens_fashion'
	| 'packaging';
export type SupplierTerm = '+3' | '+5' | '+7' | '+15' | '+30' | '+45';
export type SupplierResponsibleContactType =
	| 'orders'
	| 'delivery'
	| 'financial';

export type ProductStatus = 'active' | 'inactive';

export type InventoryAdjustmentType = 'in' | 'out' | 'correction';
export type PurchaseOrderStatus =
	| 'draft'
	| 'confirmed'
	| 'receiving'
	| 'completed'
	| 'cancelled'
	| 'delayed'
	| 'payable';
export type ReceivingStatus =
	| 'scheduled'
	| 'checking'
	| 'completed'
	| 'delayed';

export type CatalogScope = {
	storeId: string;
	userId: string;
};

export type Supplier = {
	id: string;
	userId: string;
	storeId: string;
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

export type SupplierOperationalSummary = {
	activeSuppliers: number;
	delayedOrders: number;
	delayedReceivings: number;
	dueReceivings: number;
	openOrderValue: number;
	openOrders: number;
	suppliersWithResponsible: number;
	totalSuppliers: number;
};

export type SupplierResponsible = {
	id: string;
	supplierId: string;
	userId: string;
	storeId: string;
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
	storeId: string;
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
	storeId: string;
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
	storeId: string;
	productId: string;
	type: InventoryAdjustmentType;
	quantity: number;
	previousStock: number;
	currentStock: number;
	reason: string;
	createdAt: string;
};

export type PurchaseOrderItem = {
	id: string;
	purchaseOrderId: string;
	storeId: string;
	productId?: string;
	name: string;
	sku: string;
	quantity: number;
	unitCost: number;
	totalCost: number;
};

export type PurchaseOrder = {
	id: string;
	userId: string;
	storeId: string;
	supplierId: string;
	code: string;
	expectedDeliveryAt: string;
	invoiceNumber?: string;
	items: PurchaseOrderItem[];
	notes?: string;
	paymentTerm?: SupplierTerm;
	status: PurchaseOrderStatus;
	totalCost: number;
	totalItems: number;
	createdAt: string;
	updatedAt: string;
};

export type Receiving = {
	id: string;
	userId: string;
	storeId: string;
	supplierId: string;
	purchaseOrderId?: string;
	invoiceNumber: string;
	expectedAt: string;
	receivedAt?: string;
	volumes: number;
	dock?: string;
	receiverName?: string;
	discrepancies?: string;
	status: ReceivingStatus;
	itemsCount: number;
	createdAt: string;
	updatedAt: string;
};

export type CreateSupplierInput = CatalogScope & {
	name: string;
	category?: SupplierCategory;
	document?: string;
	deliveryTerm?: SupplierTerm;
	email?: string;
	minimumOrder?: string;
	notes?: string;
	paymentTerm?: SupplierTerm;
	phone?: string;
	responsibles?: Array<{
		contactType: SupplierResponsibleContactType;
		email: string;
		isPrimary: boolean;
		name: string;
		phone: string;
		role: string;
		status: SupplierStatus;
	}>;
	status?: SupplierStatus;
};

export type UpdateSupplierInput = Partial<
	Omit<CreateSupplierInput, 'storeId' | 'userId'>
> & {
	id: string;
	storeId: string;
	userId: string;
	status?: SupplierStatus;
};

export type CreateSupplierResponsibleInput = CatalogScope & {
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
	Omit<CreateSupplierResponsibleInput, 'storeId' | 'userId' | 'supplierId'>
> & {
	id: string;
	storeId: string;
	userId: string;
	supplierId: string;
};

export type CreateProductInput = CatalogScope & {
	name: string;
	sku: string;
	description?: string;
	supplierId?: string;
	costPrice?: number;
	salePrice?: number;
	currentStock?: number;
	minimumStock?: number;
};

export type UpdateProductInput = Partial<
	Omit<CreateProductInput, 'storeId' | 'userId'>
> & {
	id: string;
	storeId: string;
	userId: string;
	status?: ProductStatus;
};

export type CreateInventoryAdjustmentInput = CatalogScope & {
	productId: string;
	type: InventoryAdjustmentType;
	quantity: number;
	reason: string;
};

export type CreatePurchaseOrderInput = CatalogScope & {
	supplierId: string;
	expectedDeliveryAt: string;
	invoiceNumber?: string;
	items: Array<{
		productId?: string;
		name: string;
		sku: string;
		quantity: number;
		unitCost: number;
	}>;
	notes?: string;
	paymentTerm?: SupplierTerm;
	status?: PurchaseOrderStatus;
};

export type UpdatePurchaseOrderInput = Partial<
	Omit<CreatePurchaseOrderInput, 'storeId' | 'userId' | 'supplierId' | 'items'>
> & {
	id: string;
	storeId: string;
	userId: string;
	status?: PurchaseOrderStatus;
};

export type CreateReceivingInput = CatalogScope & {
	supplierId: string;
	purchaseOrderId?: string;
	invoiceNumber: string;
	expectedAt: string;
	receivedAt?: string;
	volumes: number;
	dock?: string;
	receiverName?: string;
	discrepancies?: string;
	status?: ReceivingStatus;
};

export type UpdateReceivingInput = Partial<
	Omit<
		CreateReceivingInput,
		'storeId' | 'userId' | 'supplierId' | 'purchaseOrderId'
	>
> & {
	id: string;
	storeId: string;
	userId: string;
	status?: ReceivingStatus;
};

export type PrepareProductImageUploadInput = CatalogScope & {
	productId: string;
	storeBucketKey: string;
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
	supplierId?: string;
	page?: number;
	perPage?: number;
};
