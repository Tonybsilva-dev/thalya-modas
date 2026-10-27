import { Prisma, type PrismaClient } from '@prisma/client';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import type {
	Customer,
	CustomerInput,
	CustomerQuery,
	CustomerRepository,
} from '../../../domain/repositories/customer-repository';
import { pageResult } from '../../../domain/repositories/page';

export class PrismaCustomerRepository implements CustomerRepository {
	constructor(private readonly prisma: PrismaClient) {}
	async list(storeId: string, query: CustomerQuery) {
		const where: Prisma.CustomerWhereInput = {
			storeId,
			status: query.status,
			OR: query.q
				? ['name', 'email', 'phone', 'document'].map((key) => ({
						[key]: { contains: query.q, mode: 'insensitive' },
					}))
				: undefined,
		};
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.customer.findMany({
				where,
				orderBy: [{ name: 'asc' }, { id: 'asc' }],
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.customer.count({ where }),
		]);
		return pageResult(rows.map(mapCustomer), total, query);
	}
	async find(storeId: string, id: string) {
		const row = await this.prisma.customer.findFirst({
			where: { id, storeId },
		});
		return row ? mapCustomer(row) : null;
	}
	async save(storeId: string, input: CustomerInput, id?: string) {
		const data = {
			name: input.name,
			status: input.status,
			email: input.email ?? null,
			phone: input.phone ?? null,
			document: input.document ?? null,
			notes: input.notes ?? null,
		};
		try {
			if (!id)
				return mapCustomer(
					await this.prisma.customer.create({ data: { ...data, storeId } }),
				);
			const updated = await this.prisma.customer.updateMany({
				where: { id, storeId },
				data,
			});
			if (!updated.count)
				throw new NotFoundError('Cliente não encontrado nesta filial.');
			return (await this.find(storeId, id))!;
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			)
				throw new DomainError('Documento já cadastrado nesta filial.');
			throw error;
		}
	}
}
function mapCustomer(row: {
	id: string;
	storeId: string;
	name: string;
	email: string | null;
	phone: string | null;
	document: string | null;
	notes: string | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}): Customer {
	return {
		...row,
		email: row.email ?? undefined,
		phone: row.phone ?? undefined,
		document: row.document ?? undefined,
		notes: row.notes ?? undefined,
		status: row.status as Customer['status'],
	};
}
