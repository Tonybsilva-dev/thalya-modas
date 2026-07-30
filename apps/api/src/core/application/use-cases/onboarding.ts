import { DomainError } from '../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../app/http/errors/not-found-error';
import {
	OnboardingStatus,
	OnboardingStep,
	type Store,
	type StoreAddress,
	type StoreCurrency,
	type StoreLanguage,
	type StorePreferences,
	type StoreSegment,
	StoreStatus,
	type StoreTimezone,
} from '../../domain/entities';
import type { OnboardingRepository } from '../../domain/repositories/onboarding-repository';
import type { StoreRepository } from '../../domain/repositories/store-repository';
import {
	appendStoreSlugSuffix,
	createStoreBucketKey,
	normalizeStoreSlug,
} from '../../domain/value-objects/store-slug';

export interface OnboardingOutput {
	status: OnboardingStatus;
	nextStep: OnboardingStep;
	completedSteps: OnboardingStep[];
	store?: Store;
}

export class GetOnboardingUseCase {
	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly storeRepository: StoreRepository,
	) {}

	async execute(input: { userId: string }): Promise<OnboardingOutput> {
		const onboarding = await this.onboardingRepository.findByUserId(
			input.userId,
		);
		if (!onboarding) {
			throw new NotFoundError('Onboarding não encontrado');
		}

		const store = onboarding.storeId
			? await this.storeRepository.findById(onboarding.storeId)
			: undefined;

		return {
			status: onboarding.status,
			nextStep: onboarding.nextStep,
			completedSteps: onboarding.completedSteps,
			store: store ?? undefined,
		};
	}
}

export class SaveStoreProfileUseCase {
	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly storeRepository: StoreRepository,
	) {}

	async execute(input: {
		userId: string;
		storeName: string;
		phone: string;
		document: string;
		segment: StoreSegment;
	}): Promise<OnboardingOutput> {
		const onboarding = await this.onboardingRepository.findByUserId(
			input.userId,
		);
		if (!onboarding) {
			throw new NotFoundError('Onboarding não encontrado');
		}

		if (onboarding.status === OnboardingStatus.COMPLETED) {
			throw new DomainError('Onboarding já foi concluído.');
		}

		const document = onlyDigits(input.document);
		const phone = onlyDigits(input.phone);
		assertDocument(document);
		assertPhone(phone);

		const existingDocument =
			await this.storeRepository.findByDocument(document);
		if (existingDocument && existingDocument.ownerId !== input.userId) {
			throw new DomainError('Documento já está em uso', {
				details: { document },
			});
		}

		const existingStore = onboarding.storeId
			? await this.storeRepository.findById(onboarding.storeId)
			: await this.storeRepository.findByOwnerId(input.userId);

		const store = existingStore
			? await this.storeRepository.update(existingStore.id, {
					name: input.storeName.trim(),
					phone,
					document,
					segment: input.segment,
				})
			: await this.createStore({
					ownerId: input.userId,
					name: input.storeName.trim(),
					phone,
					document,
					segment: input.segment,
					status: StoreStatus.PENDING_ONBOARDING,
				});

		if (!store) {
			throw new NotFoundError('Loja não encontrada');
		}

		const completedSteps = Array.from(
			new Set([...onboarding.completedSteps, OnboardingStep.STORE_PROFILE]),
		);
		await this.onboardingRepository.update(onboarding.id, {
			storeId: store.id,
			nextStep: OnboardingStep.STORE_ADDRESS,
			completedSteps,
		});

		return {
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.STORE_ADDRESS,
			completedSteps,
			store,
		};
	}

	private async createStore(input: {
		ownerId: string;
		name: string;
		phone: string;
		document: string;
		segment: StoreSegment;
		status: StoreStatus;
	}): Promise<Store> {
		const slug = await this.createUniqueSlug(input.name);

		return this.storeRepository.create({
			...input,
			bucketKey: createStoreBucketKey(slug),
			slug,
		});
	}

	private async createUniqueSlug(storeName: string): Promise<string> {
		const baseSlug = normalizeStoreSlug(storeName);
		let slug = baseSlug;
		let suffix = 2;

		while (await this.storeRepository.findBySlug(slug)) {
			slug = appendStoreSlugSuffix(baseSlug, suffix);
			suffix += 1;
		}

		return slug;
	}
}

export class SaveStoreAddressUseCase {
	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly storeRepository: StoreRepository,
	) {}

	async execute(input: {
		userId: string;
		zipCode: string;
		street: string;
		number: string;
		complement?: string;
		neighborhood: string;
		city: string;
		state: string;
		country?: string;
	}): Promise<OnboardingOutput> {
		const onboarding = await this.onboardingRepository.findByUserId(
			input.userId,
		);
		if (!onboarding) {
			throw new NotFoundError('Onboarding não encontrado');
		}

		if (onboarding.status === OnboardingStatus.COMPLETED) {
			throw new DomainError('Onboarding já foi concluído.');
		}

		if (
			!onboarding.storeId ||
			!onboarding.completedSteps.includes(OnboardingStep.STORE_PROFILE)
		) {
			throw new DomainError(
				'Complete o perfil da loja antes de informar o endereço.',
			);
		}

		const address = normalizeAddress(input);
		const store = await this.storeRepository.update(onboarding.storeId, {
			address,
		});

		if (!store) {
			throw new NotFoundError('Loja não encontrada');
		}

		const completedSteps = Array.from(
			new Set([...onboarding.completedSteps, OnboardingStep.STORE_ADDRESS]),
		);
		await this.onboardingRepository.update(onboarding.id, {
			nextStep: OnboardingStep.STORE_PREFERENCES,
			completedSteps,
		});

		return {
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.STORE_PREFERENCES,
			completedSteps,
			store,
		};
	}
}

export class SaveStorePreferencesUseCase {
	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly storeRepository: StoreRepository,
	) {}

	async execute(input: {
		userId: string;
		currency: StoreCurrency;
		language: StoreLanguage;
		timezone: StoreTimezone;
		openingTime: string;
		closingTime: string;
	}): Promise<OnboardingOutput> {
		const onboarding = await this.onboardingRepository.findByUserId(
			input.userId,
		);
		if (!onboarding) {
			throw new NotFoundError('Onboarding não encontrado');
		}

		if (onboarding.status === OnboardingStatus.COMPLETED) {
			throw new DomainError('Onboarding já foi concluído.');
		}

		if (
			!onboarding.storeId ||
			!onboarding.completedSteps.includes(OnboardingStep.STORE_PROFILE) ||
			!onboarding.completedSteps.includes(OnboardingStep.STORE_ADDRESS)
		) {
			throw new DomainError(
				'Complete o perfil e o endereço da loja antes de informar as preferências.',
			);
		}

		const preferences = normalizePreferences(input);
		const store = await this.storeRepository.update(onboarding.storeId, {
			preferences,
		});

		if (!store) {
			throw new NotFoundError('Loja não encontrada');
		}

		const completedSteps = Array.from(
			new Set([...onboarding.completedSteps, OnboardingStep.STORE_PREFERENCES]),
		);
		await this.onboardingRepository.update(onboarding.id, {
			nextStep: OnboardingStep.COMPLETED,
			completedSteps,
		});

		return {
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.COMPLETED,
			completedSteps,
			store,
		};
	}
}

export class CompleteOnboardingUseCase {
	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly storeRepository: StoreRepository,
	) {}

	async execute(input: { userId: string }): Promise<OnboardingOutput> {
		const onboarding = await this.onboardingRepository.findByUserId(
			input.userId,
		);
		if (!onboarding) {
			throw new NotFoundError('Onboarding não encontrado');
		}

		if (
			!onboarding.storeId ||
			!onboarding.completedSteps.includes(OnboardingStep.STORE_PROFILE) ||
			!onboarding.completedSteps.includes(OnboardingStep.STORE_ADDRESS) ||
			!onboarding.completedSteps.includes(OnboardingStep.STORE_PREFERENCES)
		) {
			throw new DomainError(
				'Complete o perfil, o endereço e as preferências da loja antes de finalizar.',
			);
		}

		const store = await this.storeRepository.update(onboarding.storeId, {
			status: StoreStatus.ACTIVE,
		});
		if (!store) {
			throw new NotFoundError('Loja não encontrada');
		}

		const completedSteps = Array.from(
			new Set([...onboarding.completedSteps, OnboardingStep.COMPLETED]),
		);
		await this.onboardingRepository.update(onboarding.id, {
			status: OnboardingStatus.COMPLETED,
			nextStep: OnboardingStep.COMPLETED,
			completedSteps,
		});

		return {
			status: OnboardingStatus.COMPLETED,
			nextStep: OnboardingStep.COMPLETED,
			completedSteps,
			store,
		};
	}
}

function onlyDigits(value: string): string {
	return value.replace(/\D/g, '');
}

function assertDocument(document: string): void {
	if (document.length !== 11 && document.length !== 14) {
		throw new DomainError('Documento deve conter CPF ou CNPJ válido.');
	}
}

function assertPhone(phone: string): void {
	if (phone.length < 10 || phone.length > 11) {
		throw new DomainError('Telefone deve conter 10 ou 11 dígitos.');
	}
}

function normalizeAddress(input: {
	zipCode: string;
	street: string;
	number: string;
	complement?: string;
	neighborhood: string;
	city: string;
	state: string;
	country?: string;
}): StoreAddress {
	const zipCode = onlyDigits(input.zipCode);
	if (zipCode.length !== 8) {
		throw new DomainError('CEP deve conter 8 dígitos.');
	}

	const state = input.state.trim().toUpperCase();
	if (!/^[A-Z]{2}$/.test(state)) {
		throw new DomainError('Estado deve conter uma UF válida.');
	}

	const requiredFields = [
		input.street,
		input.number,
		input.neighborhood,
		input.city,
	];
	if (requiredFields.some((field) => field.trim().length < 1)) {
		throw new DomainError('Endereço incompleto.');
	}

	return {
		zipCode,
		street: input.street.trim(),
		number: input.number.trim(),
		complement: input.complement?.trim() || undefined,
		neighborhood: input.neighborhood.trim(),
		city: input.city.trim(),
		state,
		country: input.country?.trim().toUpperCase() || 'BR',
	};
}

function normalizePreferences(input: {
	currency: StoreCurrency;
	language: StoreLanguage;
	timezone: StoreTimezone;
	openingTime: string;
	closingTime: string;
}): StorePreferences {
	assertBusinessTime(input.openingTime, 'Horário de abertura inválido.');
	assertBusinessTime(input.closingTime, 'Horário de fechamento inválido.');

	if (toMinutes(input.openingTime) >= toMinutes(input.closingTime)) {
		throw new DomainError(
			'Horário de abertura deve ser anterior ao horário de fechamento.',
		);
	}

	return {
		currency: input.currency,
		language: input.language,
		timezone: input.timezone,
		openingTime: input.openingTime,
		closingTime: input.closingTime,
	};
}

function assertBusinessTime(value: string, message: string): void {
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
		throw new DomainError(message);
	}
}

function toMinutes(value: string): number {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
}
