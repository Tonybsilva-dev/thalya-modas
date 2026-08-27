import { describe, expect, it } from 'vitest';
import { createProductSku } from '../../../../../src/core/domain/value-objects/product-sku';

describe('Product SKU', () => {
	it('deve gerar identificador estável a partir do ID do produto', () => {
		const productId = '85b0f6ac-75e8-4a99-aaf1-c23c21e9cd0d';

		expect(createProductSku(productId)).toBe(
			'PRD-85B0F6AC75E84A99AAF1C23C21E9CD0D',
		);
		expect(createProductSku(productId)).toBe(createProductSku(productId));
	});
});
