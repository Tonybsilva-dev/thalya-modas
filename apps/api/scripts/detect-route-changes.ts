#!/usr/bin/env tsx
/**
 * Script para detectar mudanças nas rotas comparando especificações OpenAPI
 * Gera um relatório detalhado das mudanças
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface RouteInfo {
	method: string;
	path: string;
	summary?: string;
	tags?: string[];
	operationId?: string;
}

interface RouteChanges {
	added: RouteInfo[];
	removed: RouteInfo[];
	modified: Array<{
		route: RouteInfo;
		changes: string[];
	}>;
}

// biome-ignore lint/suspicious/noExplicitAny: OpenAPI spec pode ter estrutura variável
function extractRoutes(spec: any): RouteInfo[] {
	const routes: RouteInfo[] = [];

	if (!spec.paths) {
		return routes;
	}

	for (const [path, methods] of Object.entries(spec.paths)) {
		if (typeof methods !== 'object' || methods === null) {
			continue;
		}

		for (const [method, operation] of Object.entries(methods)) {
			if (
				!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(
					method.toLowerCase(),
				)
			) {
				continue;
			}

			// biome-ignore lint/suspicious/noExplicitAny: OpenAPI operation pode ter estrutura variável
			const op = operation as any;
			routes.push({
				method: method.toUpperCase(),
				path,
				summary: op.summary,
				tags: op.tags,
				operationId: op.operationId,
			});
		}
	}

	return routes;
}

function compareRoutes(
	oldRoutes: RouteInfo[],
	newRoutes: RouteInfo[],
): RouteChanges {
	const changes: RouteChanges = {
		added: [],
		removed: [],
		modified: [],
	};

	// Criar mapas para comparação
	const oldMap = new Map(oldRoutes.map((r) => [`${r.method}:${r.path}`, r]));
	const newMap = new Map(newRoutes.map((r) => [`${r.method}:${r.path}`, r]));

	// Encontrar rotas adicionadas
	for (const [key, route] of newMap) {
		if (!oldMap.has(key)) {
			changes.added.push(route);
		}
	}

	// Encontrar rotas removidas
	for (const [key, route] of oldMap) {
		if (!newMap.has(key)) {
			changes.removed.push(route);
		}
	}

	// Encontrar rotas modificadas (comparar propriedades)
	for (const [key, newRoute] of newMap) {
		const oldRoute = oldMap.get(key);
		if (oldRoute) {
			const routeChanges: string[] = [];

			if (oldRoute.summary !== newRoute.summary) {
				routeChanges.push('summary');
			}
			if (
				JSON.stringify(oldRoute.tags?.sort()) !==
				JSON.stringify(newRoute.tags?.sort())
			) {
				routeChanges.push('tags');
			}
			if (oldRoute.operationId !== newRoute.operationId) {
				routeChanges.push('operationId');
			}

			if (routeChanges.length > 0) {
				changes.modified.push({
					route: newRoute,
					changes: routeChanges,
				});
			}
		}
	}

	return changes;
}

function generateMarkdownReport(changes: RouteChanges): string {
	let markdown = '# 📊 Relatório de Mudanças nas Rotas\n\n';
	markdown += `**Data:** ${new Date().toISOString()}\n\n`;

	const totalChanges =
		changes.added.length + changes.removed.length + changes.modified.length;

	if (totalChanges === 0) {
		markdown += '✅ **Nenhuma mudança detectada nas rotas.**\n';
		return markdown;
	}

	markdown += `## 📈 Resumo\n\n`;
	markdown += `- ➕ **Rotas Adicionadas:** ${changes.added.length}\n`;
	markdown += `- ➖ **Rotas Removidas:** ${changes.removed.length}\n`;
	markdown += `- 🔄 **Rotas Modificadas:** ${changes.modified.length}\n`;
	markdown += `- 📊 **Total de Mudanças:** ${totalChanges}\n\n`;

	if (changes.added.length > 0) {
		markdown += `## ➕ Rotas Adicionadas\n\n`;
		for (const route of changes.added) {
			markdown += `### \`${route.method} ${route.path}\`\n`;
			if (route.summary) {
				markdown += `**Descrição:** ${route.summary}\n`;
			}
			if (route.tags && route.tags.length > 0) {
				markdown += `**Tags:** ${route.tags.join(', ')}\n`;
			}
			markdown += '\n';
		}
	}

	if (changes.removed.length > 0) {
		markdown += `## ➖ Rotas Removidas\n\n`;
		for (const route of changes.removed) {
			markdown += `### \`${route.method} ${route.path}\`\n`;
			if (route.summary) {
				markdown += `**Descrição:** ${route.summary}\n`;
			}
			markdown += '\n';
		}
	}

	if (changes.modified.length > 0) {
		markdown += `## 🔄 Rotas Modificadas\n\n`;
		for (const { route, changes: routeChanges } of changes.modified) {
			markdown += `### \`${route.method} ${route.path}\`\n`;
			if (route.summary) {
				markdown += `**Descrição:** ${route.summary}\n`;
			}
			markdown += `**Mudanças:** ${routeChanges.join(', ')}\n\n`;
		}
	}

	return markdown;
}

function main() {
	const currentSpecPath = join(process.cwd(), 'openapi-spec.json');
	const previousSpecPath = join(process.cwd(), 'openapi-spec.previous.json');
	const docsDir = join(process.cwd(), 'src', 'docs');
	const outputPath = join(docsDir, 'route-changes-report.md');

	// Garantir que o diretório docs existe
	try {
		mkdirSync(docsDir, { recursive: true });
	} catch (_error) {
		// Diretório já existe ou erro de permissão
	}

	// Ler spec atual
	if (!existsSync(currentSpecPath)) {
		console.error(
			'❌ openapi-spec.json não encontrado. Execute generate-openapi-spec.ts primeiro.',
		);
		process.exit(1);
	}

	const currentSpec = JSON.parse(readFileSync(currentSpecPath, 'utf-8'));
	const currentRoutes = extractRoutes(currentSpec);

	// Se não existe spec anterior, todas as rotas são novas
	if (!existsSync(previousSpecPath)) {
		const changes: RouteChanges = {
			added: currentRoutes,
			removed: [],
			modified: [],
		};

		const report = generateMarkdownReport(changes);
		writeFileSync(outputPath, report);

		console.log('📝 Primeira execução - todas as rotas são consideradas novas');
		console.log(`📊 Total de rotas: ${currentRoutes.length}`);
		console.log(`📄 Relatório salvo em: ${outputPath}`);

		// Salvar spec atual como previous para próxima execução
		writeFileSync(previousSpecPath, JSON.stringify(currentSpec, null, 2));
		process.exit(0);
	}

	// Comparar com spec anterior
	const previousSpec = JSON.parse(readFileSync(previousSpecPath, 'utf-8'));
	const previousRoutes = extractRoutes(previousSpec);

	const changes = compareRoutes(previousRoutes, currentRoutes);
	const report = generateMarkdownReport(changes);

	writeFileSync(outputPath, report);

	console.log('📊 Mudanças detectadas:');
	console.log(`  ➕ Adicionadas: ${changes.added.length}`);
	console.log(`  ➖ Removidas: ${changes.removed.length}`);
	console.log(`  🔄 Modificadas: ${changes.modified.length}`);
	console.log(`📄 Relatório salvo em: ${outputPath}`);

	// Atualizar spec anterior
	writeFileSync(previousSpecPath, JSON.stringify(currentSpec, null, 2));
}

main();
