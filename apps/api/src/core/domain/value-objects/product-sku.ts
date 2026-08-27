const productSkuPrefix = 'PRD';

export function createProductSku(productId: string) {
	return `${productSkuPrefix}-${productId.replaceAll('-', '').toUpperCase()}`;
}
