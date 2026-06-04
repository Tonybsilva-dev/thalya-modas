import type {
	CatalogListQuery,
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
	Receiving,
	Supplier,
	SupplierResponsible,
	UpdateProductInput,
	UpdatePurchaseOrderInput,
	UpdateReceivingInput,
	UpdateSupplierInput,
	UpdateSupplierResponsibleInput,
} from '../entities/catalog';

export interface CatalogRepository {
	createSupplier(input: CreateSupplierInput): Promise<Supplier>;
	findSupplierById(
		userId: string,
		supplierId: string,
	): Promise<Supplier | null>;
	findSupplierByDocument(
		userId: string,
		document: string,
	): Promise<Supplier | null>;
	listSuppliers(userId: string, query?: CatalogListQuery): Promise<Supplier[]>;
	updateSupplier(input: UpdateSupplierInput): Promise<Supplier>;
	deleteSupplier(userId: string, supplierId: string): Promise<void>;
	createSupplierResponsible(
		input: CreateSupplierResponsibleInput,
	): Promise<SupplierResponsible>;
	deleteSupplierResponsible(
		userId: string,
		supplierId: string,
		responsibleId: string,
	): Promise<void>;
	listSupplierResponsibles(
		userId: string,
		supplierId: string,
	): Promise<SupplierResponsible[]>;
	updateSupplierResponsible(
		input: UpdateSupplierResponsibleInput,
	): Promise<SupplierResponsible>;

	createProduct(input: CreateProductInput): Promise<Product>;
	findProductById(userId: string, productId: string): Promise<Product | null>;
	findProductBySku(userId: string, sku: string): Promise<Product | null>;
	listProducts(userId: string, query?: CatalogListQuery): Promise<Product[]>;
	updateProduct(input: UpdateProductInput): Promise<Product>;

	createInventoryAdjustment(
		input: CreateInventoryAdjustmentInput,
	): Promise<InventoryMovement>;
	listInventoryMovements(
		userId: string,
		productId?: string,
	): Promise<InventoryMovement[]>;

	createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
	listPurchaseOrders(
		userId: string,
		query?: CatalogListQuery,
	): Promise<PurchaseOrder[]>;
	updatePurchaseOrder(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder>;

	createReceiving(input: CreateReceivingInput): Promise<Receiving>;
	listReceivings(
		userId: string,
		query?: CatalogListQuery,
	): Promise<Receiving[]>;
	updateReceiving(input: UpdateReceivingInput): Promise<Receiving>;

	prepareProductImageUpload(
		input: PrepareProductImageUploadInput,
	): Promise<PreparedProductImageUpload>;
}
