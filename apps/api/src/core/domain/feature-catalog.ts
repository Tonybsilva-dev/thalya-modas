export const DEFAULT_PLAN_ID = '00000000-0000-4000-8000-000000000001';
export const featureCatalog = [
	{
		key: 'catalog',
		label: 'Catálogo',
		description: 'Produtos e imagens.',
		features: [
			{ key: 'catalog.products', label: 'Produtos', available: true },
			{ key: 'catalog.images', label: 'Imagens de produtos', available: true },
		],
	},
	{
		key: 'inventory',
		label: 'Estoque',
		description: 'Movimentações e ajustes por filial.',
		features: [
			{ key: 'inventory.movements', label: 'Movimentações', available: true },
			{
				key: 'inventory.adjustments',
				label: 'Ajustes de estoque',
				available: true,
			},
		],
	},
	{
		key: 'purchasing',
		label: 'Compras',
		description: 'Fornecedores, pedidos e recebimentos.',
		features: [
			{
				key: 'purchasing.suppliers',
				label: 'Fornecedores e contatos',
				available: true,
			},
			{ key: 'purchasing.orders', label: 'Pedidos de compra', available: true },
			{ key: 'purchasing.receivings', label: 'Recebimentos', available: true },
		],
	},
	{
		key: 'sales',
		label: 'Vendas',
		description: 'Pedidos de venda e clientes.',
		features: [
			{ key: 'sales.orders', label: 'Pedidos de venda', available: true },
			{
				key: 'sales.customers',
				label: 'Consulta de clientes',
				available: true,
			},
		],
	},
	{
		key: 'finance',
		label: 'Financeiro',
		description: 'Caixa e títulos de clientes.',
		features: [
			{ key: 'finance.cash', label: 'Caixa', available: true },
			{
				key: 'finance.receivables',
				label: 'Consulta de títulos',
				available: true,
			},
		],
	},
	{
		key: 'analytics',
		label: 'Análises',
		description: 'Indicadores e relatórios operacionais.',
		features: [
			{
				key: 'analytics.overview',
				label: 'Visão geral da filial',
				available: true,
			},
			{
				key: 'analytics.reports',
				label: 'Consulta de relatórios',
				available: true,
			},
		],
	},
] as const;
export const catalogKeys: string[] = featureCatalog.flatMap((module) => [
	module.key,
	...module.features.map((feature) => feature.key),
]);
export const defaultPlanFlags = Object.fromEntries(
	catalogKeys.map((key) => [key, true]),
);
export type FeatureFlags = Record<string, boolean>;
export function operationalFeature(url: string): string | undefined {
	if (url.startsWith('/sales/orders')) return 'sales.orders';
	if (url.startsWith('/cash-register')) return 'finance.cash';
	if (url.startsWith('/receivables') || url.endsWith('/receivables'))
		return 'finance.receivables';
	if (url.startsWith('/products/') && url.includes('/assets'))
		return 'catalog.images';
	if (url.startsWith('/products')) return 'catalog.products';
	if (url.startsWith('/suppliers') || url === '/dashboard/suppliers')
		return 'purchasing.suppliers';
	if (url.startsWith('/purchase-orders')) return 'purchasing.orders';
	if (url.startsWith('/receivings')) return 'purchasing.receivings';
	if (url.startsWith('/inventory/adjustments')) return 'inventory.adjustments';
	if (url.startsWith('/inventory/movements') || url === '/dashboard/inventory')
		return 'inventory.movements';
	if (url === '/dashboard/orders') return 'sales.orders';
	if (url.includes('/promissory')) return 'finance.receivables';
	if (url.startsWith('/customers') || url.startsWith('/dashboard/customers'))
		return 'sales.customers';
	if (url === '/dashboard/cash-register') return 'finance.cash';
	if (url === '/dashboard/overview') return 'analytics.overview';
	if (url === '/dashboard/reports') return 'analytics.reports';
}
