import { randomUUID } from 'node:crypto';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import type {
	Customer,
	CustomerInput,
	CustomerQuery,
	CustomerRepository,
} from '../../../domain/repositories/customer-repository';
import { pageResult } from '../../../domain/repositories/page';

export class InMemoryCustomerRepository implements CustomerRepository {
	private customers = new Map<string, Customer>();
	async list(storeId: string, query: CustomerQuery) {
		const rows = [...this.customers.values()]
			.filter(
				(row) =>
					row.storeId === storeId &&
					(!query.status || row.status === query.status) &&
					(!query.q ||
						[row.name, row.email, row.phone, row.document].some((value) =>
							value?.toLowerCase().includes(query.q!.toLowerCase()),
						)),
			)
			.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
		return pageResult(
			structuredClone(
				rows.slice(
					(query.page - 1) * query.perPage,
					query.page * query.perPage,
				),
			),
			rows.length,
			query,
		);
	}
	async find(storeId: string, id: string) {
		const row = this.customers.get(id);
		return row?.storeId === storeId ? structuredClone(row) : null;
	}
	async save(storeId: string, input: CustomerInput, id?: string) {
		const previous = id ? await this.find(storeId, id) : null;
		if (id && !previous)
			throw new NotFoundError('Cliente não encontrado nesta filial.');
		if (
			input.document &&
			[...this.customers.values()].some(
				(row) =>
					row.storeId === storeId &&
					row.id !== id &&
					row.document === input.document,
			)
		)
			throw new DomainError('Documento já cadastrado nesta filial.');
		const row: Customer = {
			...input,
			storeId,
			id: id ?? randomUUID(),
			createdAt: previous?.createdAt ?? new Date(),
			updatedAt: new Date(),
		};
		this.customers.set(row.id, structuredClone(row));
		return structuredClone(row);
	}
}
