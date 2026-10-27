import { env } from '../../../shared/env';

type Probe = () => Promise<unknown>;
type HealthOptions = {
	checks?: { database?: Probe; redis?: Probe; queues?: Probe };
};
async function probe(check?: Probe) {
	if (!check) return 'not_configured';
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			check(),
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new Error('timeout')), 3500);
			}),
		]);
		return 'ok';
	} catch {
		return 'error';
	} finally {
		clearTimeout(timer);
	}
}
export async function healthcheckRoutes(
	app: {
		get(
			path: string,
			options: unknown,
			handler: (
				request: unknown,
				reply: {
					header(name: string, value: string): void;
					code(code: number): { send(body: unknown): unknown };
				},
			) => Promise<unknown>,
		): unknown;
	},
	options: HealthOptions = {},
) {
	const base = () => ({
		version: env.API_VERSION,
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
	app.get(
		'/health',
		{
			schema: {
				tags: ['health'],
				description: 'Disponibilidade do processo da API',
			},
		},
		async () => ({ status: 'ok', ...base() }),
	);
	app.get(
		'/health/deep',
		{
			schema: {
				tags: ['health'],
				description:
					'Verificação real de dependências; 503 quando uma dependência configurada falha',
			},
		},
		async (_, reply) => {
			reply.header('Cache-Control', 'no-store');
			const entries = await Promise.all(
				(['database', 'redis', 'queues'] as const).map(async (key) => [
					key,
					await probe(options.checks?.[key]),
				]),
			);
			const checks = Object.fromEntries(entries);
			const failed = Object.values(checks).includes('error');
			const incomplete = ['database', 'redis', 'queues'].some(
				(key) => checks[key] === 'not_configured',
			);
			return reply.code(failed ? 503 : 200).send({
				status: failed ? 'error' : incomplete ? 'degraded' : 'ok',
				...base(),
				checks,
			});
		},
	);
}
