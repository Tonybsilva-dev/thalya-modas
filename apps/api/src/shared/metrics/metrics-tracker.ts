/**
 * Rastreador de métricas de performance em memória com janela móvel.
 *
 * Armazena os últimos N tempos (ms) por rota e expõe utilitários
 * para cálculo de média e snapshot para diagnóstico.
 */

export interface RouteMetricsSnapshotEntry {
	routeKey: string;
	count: number;
	averageMs: number;
	history: number[];
}

export class MetricsTracker {
	private readonly windowSize: number;
	private readonly history: Map<string, number[]>;

	constructor(windowSize: number = 50) {
		this.windowSize = windowSize;
		this.history = new Map();
	}

	add(routeKey: string, durationMs: number): void {
		if (!Number.isFinite(durationMs) || durationMs < 0) {
			return;
		}

		if (!this.history.has(routeKey)) {
			this.history.set(routeKey, []);
		}

		const times = this.history.get(routeKey);
		if (!times) {
			return;
		}

		times.push(durationMs);

		// Mantém apenas os últimos N registros (sliding window)
		if (times.length > this.windowSize) {
			times.splice(0, times.length - this.windowSize);
		}
	}

	getAverage(routeKey: string): number {
		const times = this.history.get(routeKey);
		if (!times || times.length === 0) {
			return 0;
		}

		const sum = times.reduce((acc, value) => acc + value, 0);
		return sum / times.length;
	}

	getCount(routeKey: string): number {
		const times = this.history.get(routeKey);
		return times?.length ?? 0;
	}

	/**
	 * Retorna um snapshot das métricas atuais para todas as rotas.
	 * Útil para endpoints internos de diagnóstico.
	 */
	getAll(): RouteMetricsSnapshotEntry[] {
		const result: RouteMetricsSnapshotEntry[] = [];

		for (const [routeKey, times] of this.history.entries()) {
			const count = times.length;
			const averageMs =
				count === 0 ? 0 : times.reduce((acc, value) => acc + value, 0) / count;

			result.push({
				routeKey,
				count,
				averageMs,
				history: [...times],
			});
		}

		// Ordena por rota para ter estabilidade no retorno
		return result.sort((a, b) => a.routeKey.localeCompare(b.routeKey));
	}
}

/**
 * Instância global para ser usada pela aplicação enquanto
 * estamos trabalhando com armazenamento em memória.
 */
export const metricsTracker = new MetricsTracker(50);
