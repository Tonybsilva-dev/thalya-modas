import { describe, expect, it } from 'vitest';
import {
	MetricsTracker,
	type RouteMetricsSnapshotEntry,
} from '../../../../src/shared/metrics/metrics-tracker';

describe('MetricsTracker', () => {
	it('deve adicionar tempos e calcular a média corretamente', () => {
		const tracker = new MetricsTracker(10);
		const routeKey = 'GET /users';

		tracker.add(routeKey, 100);
		tracker.add(routeKey, 200);
		tracker.add(routeKey, 300);

		expect(tracker.getCount(routeKey)).toBe(3);
		expect(tracker.getAverage(routeKey)).toBeCloseTo(200);
	});

	it('deve respeitar a janela móvel (windowSize)', () => {
		const tracker = new MetricsTracker(3);
		const routeKey = 'GET /users';

		tracker.add(routeKey, 10);
		tracker.add(routeKey, 20);
		tracker.add(routeKey, 30);
		tracker.add(routeKey, 40);

		// Apenas os três últimos devem ser considerados: 20, 30, 40
		expect(tracker.getCount(routeKey)).toBe(3);
		expect(tracker.getAverage(routeKey)).toBeCloseTo((20 + 30 + 40) / 3);
	});

	it('deve retornar 0 para média quando não há dados', () => {
		const tracker = new MetricsTracker(5);
		expect(tracker.getAverage('GET /vazia')).toBe(0);
		expect(tracker.getCount('GET /vazia')).toBe(0);
	});

	it('deve ignorar valores inválidos (NaN, negativos)', () => {
		const tracker = new MetricsTracker(5);
		const routeKey = 'GET /invalidos';

		// @ts-expect-error teste de robustez com NaN
		tracker.add(routeKey, Number.NaN);
		tracker.add(routeKey, -10);
		tracker.add(routeKey, 50);

		expect(tracker.getCount(routeKey)).toBe(1);
		expect(tracker.getAverage(routeKey)).toBeCloseTo(50);
	});

	it('deve retornar snapshot completo em getAll()', () => {
		const tracker = new MetricsTracker(5);
		tracker.add('GET /a', 10);
		tracker.add('GET /b', 20);
		tracker.add('GET /b', 40);

		const all = tracker.getAll();

		// Tipagem explícita só para garantir que o tipo exportado está correto
		const typedAll: RouteMetricsSnapshotEntry[] = all;
		expect(typedAll.length).toBe(2);

		const entryA = typedAll.find((m) => m.routeKey === 'GET /a');
		const entryB = typedAll.find((m) => m.routeKey === 'GET /b');

		expect(entryA).toBeDefined();
		expect(entryA?.count).toBe(1);
		expect(entryA?.averageMs).toBeCloseTo(10);
		expect(entryA?.history).toEqual([10]);

		expect(entryB).toBeDefined();
		expect(entryB?.count).toBe(2);
		expect(entryB?.averageMs).toBeCloseTo(30);
		expect(entryB?.history).toEqual([20, 40]);
	});
});
