import { DomainError } from '../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../app/http/errors/not-found-error';
import type {
	CustomerInput,
	CustomerRepository,
} from '../../domain/repositories/customer-repository';

export class SaveCustomerUseCase {
	constructor(private readonly repository: CustomerRepository) {}
	async execute(storeId: string, input: CustomerInput, id?: string) {
		if (id && !(await this.repository.find(storeId, id)))
			throw new NotFoundError('Cliente não encontrado nesta filial.');
		const name = input.name.trim();
		if (name.length < 2) throw new DomainError('Informe o nome do cliente.');
		const document = input.document?.replace(/\D/g, '') || undefined;
		if (document && ![11, 14].includes(document.length))
			throw new DomainError('Documento deve conter 11 ou 14 dígitos.');
		const phone = input.phone?.replace(/\D/g, '') || undefined;
		if (phone && ![10, 11].includes(phone.length))
			throw new DomainError('Telefone deve conter 10 ou 11 dígitos.');
		return this.repository.save(
			storeId,
			{
				status: input.status,
				name,
				document,
				phone,
				email: input.email?.trim().toLowerCase() || undefined,
				notes: input.notes?.trim() || undefined,
			},
			id,
		);
	}
}
