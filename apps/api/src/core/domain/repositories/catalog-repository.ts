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
	Receiving,
	Supplier,
	SupplierOperationalSummary,
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
		scope: CatalogScope,
		supplierId: string,
	): Promise<Supplier | null>;
	findSupplierByDocument(
		scope: CatalogScope,
		document: string,
	): Promise<Supplier | null>;
	listSuppliers(
		scope: CatalogScope,
		query?: CatalogListQuery,
	): Promise<Supplier[]>;
	getSupplierOperationalSummary(
		scope: CatalogScope,
	): Promise<SupplierOperationalSummary>;
	updateSupplier(input: UpdateSupplierInput): Promise<Supplier>;
	deleteSupplier(scope: CatalogScope, supplierId: string): Promise<void>;
	createSupplierResponsible(
		input: CreateSupplierResponsibleInput,
	): Promise<SupplierResponsible>;
	deleteSupplierResponsible(
		scope: CatalogScope,
		supplierId: string,
		responsibleId: string,
	): Promise<void>;
	listSupplierResponsibles(
		scope: CatalogScope,
		supplierId: string,
	): Promise<SupplierResponsible[]>;
	updateSupplierResponsible(
		input: UpdateSupplierResponsibleInput,
	): Promise<SupplierResponsible>;

	createProduct(input: CreateProductInput): Promise<Product>;
	findProductById(
		scope: CatalogScope,
		productId: string,
	): Promise<Product | null>;
	findProductBySku(scope: CatalogScope, sku: string): Promise<Product | null>;
	listProducts(
		scope: CatalogScope,
		query?: CatalogListQuery,
	): Promise<Product[]>;
	updateProduct(input: UpdateProductInput): Promise<Product>;

	createInventoryAdjustment(
		input: CreateInventoryAdjustmentInput,
	): Promise<InventoryMovement>;
	listInventoryMovements(
		scope: CatalogScope,
		productId?: string,
	): Promise<InventoryMovement[]>;

	createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
	listPurchaseOrders(
		scope: CatalogScope,
		query?: CatalogListQuery,
	): Promise<PurchaseOrder[]>;
	updatePurchaseOrder(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder>;

	createReceiving(input: CreateReceivingInput): Promise<Receiving>;
	listReceivings(
		scope: CatalogScope,
		query?: CatalogListQuery,
	): Promise<Receiving[]>;
	updateReceiving(input: UpdateReceivingInput): Promise<Receiving>;

	prepareProductImageUpload(
		input: PrepareProductImageUploadInput,
	): Promise<PreparedProductImageUpload>;
}
