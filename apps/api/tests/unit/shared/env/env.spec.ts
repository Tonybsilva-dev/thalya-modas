import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('env validation', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		// Limpa o cache do módulo env para permitir testes isolados
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.resetModules();
	});

	it('deve usar valores padrão quando variáveis não estão definidas', async () => {
		// Remove todas as variáveis de ambiente
		process.env = {};

		// Importa o módulo após limpar o cache
		const { env } = await import('../../../../src/shared/env/env');

		expect(env.NODE_ENV).toBe('development');
		expect(env.PORT).toBe(3000);
		expect(env.HOST).toBe('0.0.0.0');
		expect(env.API_VERSION).toBe('1.0.0');
		expect(env.API_TITLE).toBe('Fastify Boilerplate API');
		expect(env.JWT_EXPIRES_IN).toBe('7d');
		expect(env.API_LICENSE_NAME).toBe('ISC');
	});

	it('deve validar NODE_ENV como enum', async () => {
		process.env.NODE_ENV = 'production';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.NODE_ENV).toBe('production');
	});

	it('deve validar PORT como número positivo', async () => {
		process.env.PORT = '8080';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.PORT).toBe(8080);
		expect(typeof env.PORT).toBe('number');
	});

	it('deve usar valor padrão quando PORT é string vazia', async () => {
		process.env.PORT = '';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.PORT).toBe(3000);
	});

	it('deve usar valor padrão quando PORT é undefined', async () => {
		delete process.env.PORT;

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.PORT).toBe(3000);
	});

	it('deve validar JWT_SECRET com mínimo de 32 caracteres', async () => {
		process.env.JWT_SECRET =
			'valid-secret-key-with-more-than-32-characters-long';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.JWT_SECRET).toBe(
			'valid-secret-key-with-more-than-32-characters-long',
		);
		expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
	});

	it('deve usar valor padrão quando JWT_SECRET é string vazia', async () => {
		process.env.JWT_SECRET = '';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
	});

	it('deve validar URL opcional para API_BASE_URL', async () => {
		process.env.API_BASE_URL = 'https://api.example.com';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.API_BASE_URL).toBe('https://api.example.com');
	});

	it('deve transformar string vazia em undefined para API_BASE_URL', async () => {
		process.env.API_BASE_URL = '';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.API_BASE_URL).toBeUndefined();
	});

	it('deve validar email opcional para API_CONTACT_EMAIL', async () => {
		process.env.API_CONTACT_EMAIL = 'contact@example.com';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.API_CONTACT_EMAIL).toBe('contact@example.com');
	});

	it('deve transformar string vazia em undefined para API_CONTACT_EMAIL', async () => {
		process.env.API_CONTACT_EMAIL = '';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.API_CONTACT_EMAIL).toBeUndefined();
	});

	it('deve validar todas as URLs opcionais', async () => {
		process.env.API_BASE_URL = 'https://api.example.com';
		process.env.API_DEV_URL = 'https://dev-api.example.com';
		process.env.API_STAGING_URL = 'https://staging-api.example.com';
		process.env.API_PRODUCTION_URL = 'https://prod-api.example.com';
		process.env.API_CONTACT_URL = 'https://contact.example.com';
		process.env.API_LICENSE_URL = 'https://license.example.com';
		process.env.API_TERMS_OF_SERVICE = 'https://terms.example.com';
		process.env.API_EXTERNAL_DOCS_URL = 'https://docs.example.com';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.API_BASE_URL).toBe('https://api.example.com');
		expect(env.API_DEV_URL).toBe('https://dev-api.example.com');
		expect(env.API_STAGING_URL).toBe('https://staging-api.example.com');
		expect(env.API_PRODUCTION_URL).toBe('https://prod-api.example.com');
		expect(env.API_CONTACT_URL).toBe('https://contact.example.com');
		expect(env.API_LICENSE_URL).toBe('https://license.example.com');
		expect(env.API_TERMS_OF_SERVICE).toBe('https://terms.example.com');
		expect(env.API_EXTERNAL_DOCS_URL).toBe('https://docs.example.com');
	});

	it('deve transformar strings vazias em undefined para campos opcionais', async () => {
		process.env.API_CONTACT_NAME = '';
		process.env.API_CONTACT_EMAIL = '';
		process.env.API_EXTERNAL_DOCS_DESCRIPTION = '';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.API_CONTACT_NAME).toBeUndefined();
		expect(env.API_CONTACT_EMAIL).toBeUndefined();
		expect(env.API_EXTERNAL_DOCS_DESCRIPTION).toBeUndefined();
	});

	it('deve validar PORT como número inteiro', async () => {
		process.env.PORT = '3000';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.PORT).toBe(3000);
		expect(Number.isInteger(env.PORT)).toBe(true);
	});

	it('deve usar valor padrão quando PORT não é um número válido', async () => {
		process.env.PORT = 'invalid';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.PORT).toBe(3000);
	});

	it('deve validar NODE_ENV como test', async () => {
		process.env.NODE_ENV = 'test';

		const { env } = await import('../../../../src/shared/env/env');

		expect(env.NODE_ENV).toBe('test');
	});
});
