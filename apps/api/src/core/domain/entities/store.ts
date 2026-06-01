export enum StoreStatus {
	PENDING_ONBOARDING = 'PENDING_ONBOARDING',
	ACTIVE = 'ACTIVE',
	SUSPENDED = 'SUSPENDED',
}

export enum StoreSegment {
	FASHION = 'fashion',
	ACCESSORIES = 'accessories',
	FOOTWEAR = 'footwear',
	MIXED = 'mixed',
}

export enum StoreCurrency {
	BRL = 'BRL',
}

export enum StoreLanguage {
	PT_BR = 'pt-BR',
}

export enum StoreTimezone {
	AMERICA_FORTALEZA = 'America/Fortaleza',
	AMERICA_SAO_PAULO = 'America/Sao_Paulo',
}

export interface Store {
	id: string;
	ownerId: string;
	name: string;
	phone: string;
	document: string;
	segment: StoreSegment;
	address?: StoreAddress;
	preferences?: StorePreferences;
	status: StoreStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface StorePreferences {
	currency: StoreCurrency;
	language: StoreLanguage;
	timezone: StoreTimezone;
	openingTime: string;
	closingTime: string;
}

export interface StoreAddress {
	zipCode: string;
	street: string;
	number: string;
	complement?: string;
	neighborhood: string;
	city: string;
	state: string;
	country: string;
}
