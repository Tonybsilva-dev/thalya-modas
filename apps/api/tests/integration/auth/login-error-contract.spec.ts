import { expect, it, vi } from 'vitest';
import { InMemoryUserRepository } from '../../../src/core/infra/persistence/in-memory/in-memory-user-repository';
import { createTestServer } from '../helpers/test-server';

it('does not expose database failures in login HTTP responses', async () => {
	const users = new InMemoryUserRepository();
	vi.spyOn(users, 'findByEmail').mockRejectedValue(
		new Error(
			'Invalid prisma.user.findUnique invocation at C:\\private\\repository.ts:23; localhost:5433 unavailable',
		),
	);
	const app = await createTestServer(users);
	try {
		const result = await app.inject({
			method: 'POST',
			url: '/auth/login',
			payload: { email: 'test@example.com', password: 'ExamplePassword123' },
		});
		expect(result.statusCode).toBe(500);
		expect(result.json()).toMatchObject({
			userMessage:
				'Não foi possível concluir agora. Tente novamente em instantes.',
			traceId: expect.any(String),
		});
		expect(result.body).not.toMatch(
			/prisma|private|localhost|5433|stack|cause/,
		);
	} finally {
		await app.close();
	}
});
