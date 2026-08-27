import type {
	CatalogListQuery,
	CatalogScope,
	CreateInventoryAdjustmentInput,
	CreateProductInput,
	CreatePurchaseOrderInput,
	CreateReceivingInput,
	CreateSupplierInput,
	CreateSupplierResponsibleInput,
	PrepareProductImageUploadInput,
	UpdateProductInput,
	UpdatePurchaseOrderInput,
	UpdateReceivingInput,
	UpdateSupplierInput,
	UpdateSupplierResponsibleInput,
} from '../../domain/entities/catalog';
import type { CatalogRepository } from '../../domain/repositories/catalog-repository';

export class ListSuppliersUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { query?: CatalogListQuery }) {
		return this.catalogRepository.listSuppliers(input, input.query);
	}
}

export class GetSupplierOperationalSummaryUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope) {
		return this.catalogRepository.getSupplierOperationalSummary(input);
	}
}

export class CreateSupplierUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CreateSupplierInput) {
		return this.catalogRepository.createSupplier(input);
	}
}

export class GetSupplierUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { supplierId: string }) {
		return this.catalogRepository.findSupplierById(input, input.supplierId);
	}
}

export class UpdateSupplierUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: UpdateSupplierInput) {
		return this.catalogRepository.updateSupplier(input);
	}
}

export class DeleteSupplierUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { supplierId: string }) {
		return this.catalogRepository.deleteSupplier(input, input.supplierId);
	}
}

export class ListSupplierResponsiblesUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { supplierId: string }) {
		return this.catalogRepository.listSupplierResponsibles(
			input,
			input.supplierId,
		);
	}
}

export class CreateSupplierResponsibleUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CreateSupplierResponsibleInput) {
		return this.catalogRepository.createSupplierResponsible(input);
	}
}

export class UpdateSupplierResponsibleUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: UpdateSupplierResponsibleInput) {
		return this.catalogRepository.updateSupplierResponsible(input);
	}
}

export class DeleteSupplierResponsibleUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(
		input: CatalogScope & {
			supplierId: string;
			responsibleId: string;
		},
	) {
		return this.catalogRepository.deleteSupplierResponsible(
			input,
			input.supplierId,
			input.responsibleId,
		);
	}
}

export class ListProductsUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { query?: CatalogListQuery }) {
		return this.catalogRepository.listProducts(input, input.query);
	}
}

export class CreateProductUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CreateProductInput) {
		return this.catalogRepository.createProduct(input);
	}
}

export class GetProductUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { productId: string }) {
		return this.catalogRepository.findProductById(input, input.productId);
	}
}

export class GetProductByBarcodeUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { barcode: string }) {
		return this.catalogRepository.findProductByBarcode(input, input.barcode);
	}
}

export class UpdateProductUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: UpdateProductInput) {
		return this.catalogRepository.updateProduct(input);
	}
}

export class CreateInventoryAdjustmentUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CreateInventoryAdjustmentInput) {
		return this.catalogRepository.createInventoryAdjustment(input);
	}
}

export class ListInventoryMovementsUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { productId?: string }) {
		return this.catalogRepository.listInventoryMovements(
			input,
			input.productId,
		);
	}
}

export class ListPurchaseOrdersUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { query?: CatalogListQuery }) {
		return this.catalogRepository.listPurchaseOrders(input, input.query);
	}
}

export class CreatePurchaseOrderUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CreatePurchaseOrderInput) {
		return this.catalogRepository.createPurchaseOrder(input);
	}
}

export class UpdatePurchaseOrderUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: UpdatePurchaseOrderInput) {
		return this.catalogRepository.updatePurchaseOrder(input);
	}
}

export class ListReceivingsUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { query?: CatalogListQuery }) {
		return this.catalogRepository.listReceivings(input, input.query);
	}
}

export class CreateReceivingUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CreateReceivingInput) {
		return this.catalogRepository.createReceiving(input);
	}
}

export class UpdateReceivingUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: UpdateReceivingInput) {
		return this.catalogRepository.updateReceiving(input);
	}
}

export class PrepareProductImageUploadUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: PrepareProductImageUploadInput) {
		return this.catalogRepository.prepareProductImageUpload(input);
	}
}

export class DeleteProductImageAssetUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: CatalogScope & { assetId: string; productId: string }) {
		return this.catalogRepository.deleteProductImageAsset(
			input,
			input.productId,
			input.assetId,
		);
	}
}
