import type { Page } from './page';

export type Customer = {
	id: string;
	storeId: string;
	name: string;
	email?: string;
	phone?: string;
	document?: string;
	notes?: string;
	status: 'ACTIVE' | 'INACTIVE';
	createdAt: Date;
	updatedAt: Date;
};
export type CustomerInput = Pick<
	Customer,
	'name' | 'email' | 'phone' | 'document' | 'notes' | 'status'
>;
export type CustomerQuery = {
	page: number;
	perPage: number;
	q?: string;
	status?: Customer['status'];
};
export interface CustomerRepository {
	list(storeId: string, query: CustomerQuery): Promise<Page<Customer>>;
	find(storeId: string, id: string): Promise<Customer | null>;
	save(storeId: string, input: CustomerInput, id?: string): Promise<Customer>;
}
