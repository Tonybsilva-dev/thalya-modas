import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	CreateInventoryAdjustmentUseCase,
	CreateProductUseCase,
	CreatePurchaseOrderUseCase,
	CreateReceivingUseCase,
	CreateSupplierResponsibleUseCase,
	CreateSupplierUseCase,
	DeleteSupplierResponsibleUseCase,
	DeleteSupplierUseCase,
	GetProductUseCase,
	GetSupplierUseCase,
	ListInventoryMovementsUseCase,
	ListProductsUseCase,
	ListPurchaseOrdersUseCase,
	ListReceivingsUseCase,
	ListSupplierResponsiblesUseCase,
	ListSuppliersUseCase,
	PrepareProductImageUploadUseCase,
	UpdateProductUseCase,
	UpdatePurchaseOrderUseCase,
	UpdateReceivingUseCase,
	UpdateSupplierResponsibleUseCase,
	UpdateSupplierUseCase,
} from '../../../core/application/use-cases/catalog';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import type { AppContainer } from '../container';
import { NotFoundError } from '../errors/not-found-error';
import { authMiddleware } from '../middlewares/auth';
import { storeContextMiddleware } from '../middlewares/store-context';

const listQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	perPage: z.coerce.number().int().positive().max(100).default(20),
	q: z.string().trim().optional(),
	status: z.string().trim().optional(),
});

const idParamsSchema = z.object({
	id: z.string().uuid(),
});

const productImageParamsSchema = z.object({
	productId: z.string().uuid(),
});

const supplierStatusSchema = z.enum(['active', 'inactive']);
const supplierCategorySchema = z.enum([
	'women_fashion',
	'accessories',
	'footwear',
	'mens_fashion',
	'packaging',
]);
const supplierTermSchema = z.enum(['+3', '+5', '+7', '+15', '+30', '+45']);
const supplierResponsibleContactTypeSchema = z.enum([
	'orders',
	'delivery',
	'financial',
]);
const productStatusSchema = z.enum(['active', 'inactive']);
const purchaseOrderStatusSchema = z.enum([
	'draft',
	'confirmed',
	'receiving',
	'completed',
	'cancelled',
	'delayed',
	'payable',
]);
const receivingStatusSchema = z.enum([
	'scheduled',
	'checking',
	'completed',
	'delayed',
]);

const createSupplierSchema = z.object({
	category: supplierCategorySchema.optional(),
	deliveryTerm: supplierTermSchema.optional(),
	document: z.string().trim().min(11).max(14).optional(),
	email: z.string().trim().email().optional(),
	minimumOrder: z.string().trim().optional(),
	name: z.string().trim().min(2),
	notes: z.string().trim().optional(),
	paymentTerm: supplierTermSchema.optional(),
	phone: z.string().trim().min(10).max(11).optional(),
});

const updateSupplierSchema = createSupplierSchema.partial().extend({
	status: supplierStatusSchema.optional(),
});

const supplierResponsibleParamsSchema = z.object({
	id: z.string().uuid(),
	responsibleId: z.string().uuid(),
});

const createSupplierResponsibleSchema = z.object({
	contactType: supplierResponsibleContactTypeSchema,
	email: z.string().trim().email(),
	isPrimary: z.boolean(),
	name: z.string().trim().min(2),
	phone: z.string().trim().min(10).max(11),
	role: z.string().trim().min(2),
	status: supplierStatusSchema,
});

const updateSupplierResponsibleSchema =
	createSupplierResponsibleSchema.partial();

const supplierResponsibleSchema = createSupplierResponsibleSchema.extend({
	createdAt: z.string(),
	id: z.string(),
	supplierId: z.string(),
	updatedAt: z.string(),
	userId: z.string(),
});

const supplierSchema = createSupplierSchema.extend({
	createdAt: z.string(),
	id: z.string(),
	responsibles: z.array(supplierResponsibleSchema),
	status: supplierStatusSchema,
	updatedAt: z.string(),
	userId: z.string(),
});

const createProductSchema = z.object({
	costPrice: z.number().nonnegative().optional(),
	currentStock: z.number().int().nonnegative().optional(),
	description: z.string().trim().optional(),
	minimumStock: z.number().int().nonnegative().optional(),
	name: z.string().trim().min(2),
	salePrice: z.number().nonnegative().optional(),
	sku: z.string().trim().min(2),
	supplierId: z.string().uuid().optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
	status: productStatusSchema.optional(),
});

const productAssetSchema = z.object({
	contentType: z.literal('image/webp'),
	createdAt: z.string(),
	fileName: z.string(),
	id: z.string(),
	key: z.string(),
	productId: z.string(),
	publicUrl: z.string().optional(),
	size: z.number(),
	userId: z.string(),
});

const productSchema = createProductSchema.extend({
	createdAt: z.string(),
	currentStock: z.number(),
	id: z.string(),
	images: z.array(productAssetSchema),
	minimumStock: z.number(),
	status: productStatusSchema,
	updatedAt: z.string(),
	userId: z.string(),
});

const inventoryAdjustmentSchema = z.object({
	productId: z.string().uuid(),
	quantity: z.number().int().positive(),
	reason: z.string().trim().min(3),
	type: z.enum(['in', 'out', 'correction']),
});

const inventoryMovementSchema = inventoryAdjustmentSchema.extend({
	createdAt: z.string(),
	currentStock: z.number(),
	id: z.string(),
	previousStock: z.number(),
	userId: z.string(),
});

const purchaseOrderItemInputSchema = z.object({
	name: z.string().trim().min(2),
	productId: z.string().uuid().optional(),
	quantity: z.number().int().positive(),
	sku: z.string().trim().min(2),
	unitCost: z.number().nonnegative(),
});

const createPurchaseOrderSchema = z.object({
	expectedDeliveryAt: z.string().datetime(),
	invoiceNumber: z.string().trim().optional(),
	items: z.array(purchaseOrderItemInputSchema).min(1),
	notes: z.string().trim().optional(),
	paymentTerm: supplierTermSchema.optional(),
	status: purchaseOrderStatusSchema.optional(),
	supplierId: z.string().uuid(),
});

const updatePurchaseOrderSchema = createPurchaseOrderSchema
	.omit({ items: true, supplierId: true })
	.partial()
	.extend({ status: purchaseOrderStatusSchema.optional() });

const purchaseOrderItemSchema = purchaseOrderItemInputSchema.extend({
	id: z.string(),
	purchaseOrderId: z.string(),
	totalCost: z.number(),
});

const purchaseOrderSchema = createPurchaseOrderSchema
	.omit({ items: true })
	.extend({
		code: z.string(),
		createdAt: z.string(),
		id: z.string(),
		items: z.array(purchaseOrderItemSchema),
		status: purchaseOrderStatusSchema,
		totalCost: z.number(),
		totalItems: z.number(),
		updatedAt: z.string(),
		userId: z.string(),
	});

const createReceivingSchema = z.object({
	discrepancies: z.string().trim().optional(),
	dock: z.string().trim().optional(),
	expectedAt: z.string().datetime(),
	invoiceNumber: z.string().trim().min(2),
	purchaseOrderId: z.string().uuid().optional(),
	receivedAt: z.string().datetime().optional(),
	receiverName: z.string().trim().optional(),
	status: receivingStatusSchema.optional(),
	supplierId: z.string().uuid(),
	volumes: z.number().int().positive(),
});

const updateReceivingSchema = createReceivingSchema
	.omit({ purchaseOrderId: true, supplierId: true })
	.partial()
	.extend({ status: receivingStatusSchema.optional() });

const receivingSchema = createReceivingSchema.extend({
	createdAt: z.string(),
	id: z.string(),
	itemsCount: z.number(),
	status: receivingStatusSchema,
	updatedAt: z.string(),
	userId: z.string(),
});

const prepareProductImageUploadSchema = z.object({
	contentType: z.literal('image/webp'),
	fileName: z
		.string()
		.trim()
		.min(1)
		.regex(/\.webp$/i),
	size: z
		.number()
		.int()
		.positive()
		.max(5 * 1024 * 1024),
});

const preparedProductImageUploadSchema = z.object({
	asset: productAssetSchema,
	upload: z.object({
		headers: z.record(z.string(), z.string()),
		key: z.string(),
		method: z.literal('PUT'),
		url: z.string(),
	}),
});

const authErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	traceId: z.string().optional(),
});

export async function catalogRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos, necessário type assertion
	fastify: any,
	options: { container: AppContainer },
) {
	const { container } = options;

	if (!container.catalogRepository) {
		throw new Error('CatalogRepository precisa estar configurado.');
	}
	const storeRepository = container.storeRepository;
	if (!storeRepository) {
		throw new Error('StoreRepository precisa estar configurado.');
	}

	const useCases = {
		createInventoryAdjustment: new CreateInventoryAdjustmentUseCase(
			container.catalogRepository,
		),
		createProduct: new CreateProductUseCase(container.catalogRepository),
		createPurchaseOrder: new CreatePurchaseOrderUseCase(
			container.catalogRepository,
		),
		createReceiving: new CreateReceivingUseCase(container.catalogRepository),
		createSupplierResponsible: new CreateSupplierResponsibleUseCase(
			container.catalogRepository,
		),
		createSupplier: new CreateSupplierUseCase(container.catalogRepository),
		deleteSupplierResponsible: new DeleteSupplierResponsibleUseCase(
			container.catalogRepository,
		),
		deleteSupplier: new DeleteSupplierUseCase(container.catalogRepository),
		getProduct: new GetProductUseCase(container.catalogRepository),
		getSupplier: new GetSupplierUseCase(container.catalogRepository),
		listInventoryMovements: new ListInventoryMovementsUseCase(
			container.catalogRepository,
		),
		listProducts: new ListProductsUseCase(container.catalogRepository),
		listPurchaseOrders: new ListPurchaseOrdersUseCase(
			container.catalogRepository,
		),
		listReceivings: new ListReceivingsUseCase(container.catalogRepository),
		listSupplierResponsibles: new ListSupplierResponsiblesUseCase(
			container.catalogRepository,
		),
		listSuppliers: new ListSuppliersUseCase(container.catalogRepository),
		prepareProductImageUpload: new PrepareProductImageUploadUseCase(
			container.catalogRepository,
		),
		updateProduct: new UpdateProductUseCase(container.catalogRepository),
		updatePurchaseOrder: new UpdatePurchaseOrderUseCase(
			container.catalogRepository,
		),
		updateReceiving: new UpdateReceivingUseCase(container.catalogRepository),
		updateSupplierResponsible: new UpdateSupplierResponsibleUseCase(
			container.catalogRepository,
		),
		updateSupplier: new UpdateSupplierUseCase(container.catalogRepository),
	};

	const preHandler = async (request: FastifyRequest, reply: unknown) => {
		container.featureFlags.assertEnabled('catalog');
		await authMiddleware(request, reply, container.jwtService);
		await storeContextMiddleware(request, reply, storeRepository);
	};

	fastify.get(
		'/suppliers',
		{
			schema: {
				description: 'Lista fornecedores cadastrados',
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				querystring: createRequestSchema({ query: listQuerySchema })
					.querystring,
				response: {
					200: createResponseSchema(
						z.array(supplierSchema),
						'Fornecedores listados',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const query = listQuerySchema.parse(getRequestQuery(request));
			return useCases.listSuppliers.execute({ query, userId: user.userId });
		},
	);

	fastify.post(
		'/suppliers',
		{
			schema: {
				body: createRequestSchema({ body: createSupplierSchema }).body,
				description: 'Cria fornecedor',
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(supplierSchema, 'Fornecedor criado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const body = createSupplierSchema.parse(getRequestBody(request));
			reply.code(201);
			return useCases.createSupplier.execute({ ...body, userId: user.userId });
		},
	);

	fastify.get(
		'/suppliers/:id',
		{
			schema: {
				description: 'Obtém fornecedor por ID',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(supplierSchema, 'Fornecedor encontrado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const supplier = await useCases.getSupplier.execute({
				supplierId: params.id,
				userId: user.userId,
			});
			if (!supplier) throw new NotFoundError('Fornecedor não encontrado.');
			return supplier;
		},
	);

	fastify.patch(
		'/suppliers/:id',
		{
			schema: {
				body: createRequestSchema({ body: updateSupplierSchema }).body,
				description: 'Atualiza fornecedor',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(supplierSchema, 'Fornecedor atualizado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const body = updateSupplierSchema.parse(getRequestBody(request));
			return useCases.updateSupplier.execute({
				...body,
				id: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.delete(
		'/suppliers/:id',
		{
			schema: {
				description: 'Remove fornecedor',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					204: { description: 'Fornecedor removido', type: 'null' },
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			await useCases.deleteSupplier.execute({
				supplierId: params.id,
				userId: user.userId,
			});
			reply.code(204);
		},
	);

	fastify.get(
		'/suppliers/:id/responsibles',
		{
			schema: {
				description: 'Lista responsáveis do fornecedor',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(
						z.array(supplierResponsibleSchema),
						'Responsáveis listados',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			return useCases.listSupplierResponsibles.execute({
				supplierId: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.post(
		'/suppliers/:id/responsibles',
		{
			schema: {
				body: createRequestSchema({ body: createSupplierResponsibleSchema })
					.body,
				description: 'Cria responsável do fornecedor',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(
						supplierResponsibleSchema,
						'Responsável criado',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const body = createSupplierResponsibleSchema.parse(
				getRequestBody(request),
			);
			reply.code(201);
			return useCases.createSupplierResponsible.execute({
				...body,
				supplierId: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.patch(
		'/suppliers/:id/responsibles/:responsibleId',
		{
			schema: {
				body: createRequestSchema({ body: updateSupplierResponsibleSchema })
					.body,
				description: 'Atualiza responsável do fornecedor',
				params: createRequestSchema({
					params: supplierResponsibleParamsSchema,
				}).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(
						supplierResponsibleSchema,
						'Responsável atualizado',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = supplierResponsibleParamsSchema.parse(
				getRequestParams(request),
			);
			const body = updateSupplierResponsibleSchema.parse(
				getRequestBody(request),
			);
			return useCases.updateSupplierResponsible.execute({
				...body,
				id: params.responsibleId,
				supplierId: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.delete(
		'/suppliers/:id/responsibles/:responsibleId',
		{
			schema: {
				description: 'Remove responsável do fornecedor',
				params: createRequestSchema({
					params: supplierResponsibleParamsSchema,
				}).params,
				tags: ['suppliers'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					204: { description: 'Responsável removido', type: 'null' },
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const params = supplierResponsibleParamsSchema.parse(
				getRequestParams(request),
			);
			await useCases.deleteSupplierResponsible.execute({
				responsibleId: params.responsibleId,
				supplierId: params.id,
				userId: user.userId,
			});
			reply.code(204);
		},
	);

	fastify.get(
		'/products',
		{
			schema: {
				description: 'Lista produtos cadastrados',
				tags: ['products'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				querystring: createRequestSchema({ query: listQuerySchema })
					.querystring,
				response: {
					200: createResponseSchema(
						z.array(productSchema),
						'Produtos listados',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const query = listQuerySchema.parse(getRequestQuery(request));
			return useCases.listProducts.execute({ query, userId: user.userId });
		},
	);

	fastify.post(
		'/products',
		{
			schema: {
				body: createRequestSchema({ body: createProductSchema }).body,
				description: 'Cria produto',
				tags: ['products'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(productSchema, 'Produto criado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const body = createProductSchema.parse(getRequestBody(request));
			reply.code(201);
			return useCases.createProduct.execute({ ...body, userId: user.userId });
		},
	);

	fastify.get(
		'/products/:id',
		{
			schema: {
				description: 'Obtém produto por ID',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['products'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(productSchema, 'Produto encontrado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const product = await useCases.getProduct.execute({
				productId: params.id,
				userId: user.userId,
			});
			if (!product) throw new NotFoundError('Produto não encontrado.');
			return product;
		},
	);

	fastify.patch(
		'/products/:id',
		{
			schema: {
				body: createRequestSchema({ body: updateProductSchema }).body,
				description: 'Atualiza produto',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['products'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(productSchema, 'Produto atualizado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const body = updateProductSchema.parse(getRequestBody(request));
			return useCases.updateProduct.execute({
				...body,
				id: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.post(
		'/products/:productId/assets/upload',
		{
			schema: {
				body: createRequestSchema({ body: prepareProductImageUploadSchema })
					.body,
				description: 'Prepara upload direto de imagem WebP do produto',
				params: createRequestSchema({ params: productImageParamsSchema })
					.params,
				tags: ['products'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(
						preparedProductImageUploadSchema,
						'Upload preparado',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const params = productImageParamsSchema.parse(getRequestParams(request));
			const body = prepareProductImageUploadSchema.parse(
				getRequestBody(request),
			);
			reply.code(201);
			return useCases.prepareProductImageUpload.execute({
				...body,
				productId: params.productId,
				userId: user.userId,
			});
		},
	);

	fastify.get(
		'/purchase-orders',
		{
			schema: {
				description: 'Lista pedidos de compra',
				tags: ['purchase-orders'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				querystring: createRequestSchema({ query: listQuerySchema })
					.querystring,
				response: {
					200: createResponseSchema(
						z.array(purchaseOrderSchema),
						'Pedidos de compra listados',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const query = listQuerySchema.parse(getRequestQuery(request));
			return useCases.listPurchaseOrders.execute({
				query,
				userId: user.userId,
			});
		},
	);

	fastify.post(
		'/purchase-orders',
		{
			schema: {
				body: createRequestSchema({ body: createPurchaseOrderSchema }).body,
				description: 'Cria pedido de compra',
				tags: ['purchase-orders'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(
						purchaseOrderSchema,
						'Pedido de compra criado',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const body = createPurchaseOrderSchema.parse(getRequestBody(request));
			reply.code(201);
			return useCases.createPurchaseOrder.execute({
				...body,
				userId: user.userId,
			});
		},
	);

	fastify.patch(
		'/purchase-orders/:id',
		{
			schema: {
				body: createRequestSchema({ body: updatePurchaseOrderSchema }).body,
				description: 'Atualiza pedido de compra',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['purchase-orders'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(
						purchaseOrderSchema,
						'Pedido de compra atualizado',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const body = updatePurchaseOrderSchema.parse(getRequestBody(request));
			return useCases.updatePurchaseOrder.execute({
				...body,
				id: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.get(
		'/receivings',
		{
			schema: {
				description: 'Lista recebimentos',
				tags: ['receivings'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				querystring: createRequestSchema({ query: listQuerySchema })
					.querystring,
				response: {
					200: createResponseSchema(
						z.array(receivingSchema),
						'Recebimentos listados',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const query = listQuerySchema.parse(getRequestQuery(request));
			return useCases.listReceivings.execute({ query, userId: user.userId });
		},
	);

	fastify.post(
		'/receivings',
		{
			schema: {
				body: createRequestSchema({ body: createReceivingSchema }).body,
				description: 'Cria recebimento de pedido de compra',
				tags: ['receivings'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(receivingSchema, 'Recebimento criado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const body = createReceivingSchema.parse(getRequestBody(request));
			reply.code(201);
			return useCases.createReceiving.execute({
				...body,
				userId: user.userId,
			});
		},
	);

	fastify.patch(
		'/receivings/:id',
		{
			schema: {
				body: createRequestSchema({ body: updateReceivingSchema }).body,
				description: 'Atualiza recebimento',
				params: createRequestSchema({ params: idParamsSchema }).params,
				tags: ['receivings'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(receivingSchema, 'Recebimento atualizado'),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const params = idParamsSchema.parse(getRequestParams(request));
			const body = updateReceivingSchema.parse(getRequestBody(request));
			return useCases.updateReceiving.execute({
				...body,
				id: params.id,
				userId: user.userId,
			});
		},
	);

	fastify.post(
		'/inventory/adjustments',
		{
			schema: {
				body: createRequestSchema({ body: inventoryAdjustmentSchema }).body,
				description: 'Cria ajuste de estoque para produto',
				tags: ['inventory'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					201: createResponseSchema(
						inventoryMovementSchema,
						'Ajuste de estoque criado',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (
			request: FastifyRequest,
			reply: { code: (status: number) => void },
		) => {
			const user = getAuthenticatedUser(request);
			const body = inventoryAdjustmentSchema.parse(getRequestBody(request));
			reply.code(201);
			return useCases.createInventoryAdjustment.execute({
				...body,
				userId: user.userId,
			});
		},
	);

	fastify.get(
		'/inventory/movements',
		{
			schema: {
				description: 'Lista movimentações de estoque',
				querystring: createRequestSchema({
					query: z.object({ productId: z.string().uuid().optional() }),
				}).querystring,
				tags: ['inventory'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(
						z.array(inventoryMovementSchema),
						'Movimentações listadas',
					),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
			preHandler,
		},
		async (request: FastifyRequest) => {
			const user = getAuthenticatedUser(request);
			const query = z
				.object({ productId: z.string().uuid().optional() })
				.parse(getRequestQuery(request));
			return useCases.listInventoryMovements.execute({
				productId: query.productId,
				userId: user.userId,
			});
		},
	);
}

function getAuthenticatedUser(request: FastifyRequest) {
	if (!request.user) {
		throw new Error('Usuário autenticado não encontrado na requisição');
	}

	return request.user;
}

function getRequestBody(request: FastifyRequest) {
	return (request as FastifyRequest & { body?: unknown }).body;
}

function getRequestParams(request: FastifyRequest) {
	return (request as FastifyRequest & { params?: unknown }).params ?? {};
}

function getRequestQuery(request: FastifyRequest) {
	return (request as FastifyRequest & { query?: unknown }).query ?? {};
}
