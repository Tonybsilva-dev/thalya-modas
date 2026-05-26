import { z } from 'zod';

// Helper para transformar strings vazias em undefined e validar como URL opcional
const optionalUrl = () =>
	z
		.union([z.string().url(), z.literal(''), z.undefined()])
		.optional()
		.transform((val) => (val === '' ? undefined : val));

// Helper para transformar strings vazias em undefined e validar como email opcional
const optionalEmail = () =>
	z
		.union([z.string().email(), z.literal(''), z.undefined()])
		.optional()
		.transform((val) => (val === '' ? undefined : val));

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	PORT: z.preprocess((val) => {
		if (val === '' || val === undefined || val === null) {
			return 3000;
		}
		const num = Number(val);
		return Number.isNaN(num) ? 3000 : num;
	}, z.number().int().positive().default(3000)),
	HOST: z.string().default('0.0.0.0'),
	API_VERSION: z.string().default('1.0.0'),
	API_TITLE: z.string().default('Fastify Boilerplate API'),
	API_DESCRIPTION: z
		.string()
		.default('API Boilerplate com Fastify, DDD e RBAC'),
	// Swagger/OpenAPI Configuration
	API_BASE_URL: optionalUrl(),
	API_DEV_URL: optionalUrl(),
	API_STAGING_URL: optionalUrl(),
	API_PRODUCTION_URL: optionalUrl(),
	API_CONTACT_NAME: z
		.string()
		.optional()
		.transform((val) => (val === '' ? undefined : val)),
	API_CONTACT_EMAIL: optionalEmail(),
	API_CONTACT_URL: optionalUrl(),
	API_LICENSE_NAME: z.string().default('ISC'),
	API_LICENSE_URL: optionalUrl(),
	API_TERMS_OF_SERVICE: optionalUrl(),
	API_EXTERNAL_DOCS_URL: optionalUrl(),
	API_EXTERNAL_DOCS_DESCRIPTION: z
		.string()
		.optional()
		.transform((val) => (val === '' ? undefined : val)),
	// JWT Configuration
	JWT_SECRET: z
		.string()
		.transform(
			(val) =>
				val || 'development-secret-key-must-be-at-least-32-characters-long',
		)
		.pipe(z.string().min(32, 'JWT secret must be at least 32 characters'))
		.default('development-secret-key-must-be-at-least-32-characters-long'),
	JWT_EXPIRES_IN: z.string().default('7d'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const missingVars = error.issues
				.map((issue) => issue.path.join('.'))
				.join(', ');
			throw new Error(`❌ Variáveis de ambiente inválidas: ${missingVars}`);
		}
		throw error;
	}
}

export const env = validateEnv();
