import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { getSwaggerConfig } from '../../src/app/http/config/swagger.config';

describe('Swagger documentation', () => {
	it('serves /docs/json with schema-less routes and preserves documented schemas', async () => {
		const app = fastify();
		try {
			await app.register(swagger, getSwaggerConfig());
			await app.register(swaggerUi, { routePrefix: '/docs' });
			app.get('/tenants', async () => []);
			const schema = {
				response: {
					200: {
						$id: 'documented-response',
						type: 'object',
						properties: { name: { type: 'string' } },
					},
				},
			};
			app.get('/documented', { schema }, async () => ({ name: 'Store Flow' }));
			const response = await app.inject({ method: 'GET', url: '/docs/json' });
			expect(response.statusCode).toBe(200);
			const document = response.json();
			expect(document.paths['/tenants'].get).toBeDefined();
			expect(
				document.paths['/documented'].get.responses['200'].content[
					'application/json'
				].schema.properties.name,
			).toEqual({ type: 'string' });
			expect(schema.response[200].$id).toBe('documented-response');
		} finally {
			await app.close();
		}
	});
});
