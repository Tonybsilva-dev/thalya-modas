import type {
	CatalogListQuery,
	CreateInventoryAdjustmentInput,
	CreateProductInput,
	CreateSupplierResponsibleInput,
	CreateSupplierInput,
	PrepareProductImageUploadInput,
	UpdateProductInput,
	UpdateSupplierResponsibleInput,
	UpdateSupplierInput,
} from '../../domain/entities/catalog';
import type { CatalogRepository } from '../../domain/repositories/catalog-repository';

export class ListSuppliersUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: { userId: string; query?: CatalogListQuery }) {
		return this.catalogRepository.listSuppliers(input.userId, input.query);
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

	execute(input: { userId: string; supplierId: string }) {
		return this.catalogRepository.findSupplierById(
			input.userId,
			input.supplierId,
		);
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

	execute(input: { userId: string; supplierId: string }) {
		return this.catalogRepository.deleteSupplier(input.userId, input.supplierId);
	}
}

export class ListSupplierResponsiblesUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: { userId: string; supplierId: string }) {
		return this.catalogRepository.listSupplierResponsibles(
			input.userId,
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

	execute(input: { userId: string; supplierId: string; responsibleId: string }) {
		return this.catalogRepository.deleteSupplierResponsible(
			input.userId,
			input.supplierId,
			input.responsibleId,
		);
	}
}

export class ListProductsUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: { userId: string; query?: CatalogListQuery }) {
		return this.catalogRepository.listProducts(input.userId, input.query);
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

	execute(input: { userId: string; productId: string }) {
		return this.catalogRepository.findProductById(input.userId, input.productId);
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

	execute(input: { userId: string; productId?: string }) {
		return this.catalogRepository.listInventoryMovements(
			input.userId,
			input.productId,
		);
	}
}

export class PrepareProductImageUploadUseCase {
	constructor(private readonly catalogRepository: CatalogRepository) {}

	execute(input: PrepareProductImageUploadInput) {
		return this.catalogRepository.prepareProductImageUpload(input);
	}
}
