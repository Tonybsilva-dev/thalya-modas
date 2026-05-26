import { describe, expect, it } from 'vitest';
import {
	normalizeDigitsOnly,
	normalizeEmail,
} from '../../../../src/shared/utils/normalize';

describe('normalizeDigitsOnly', () => {
	it('deve retornar apenas dígitos de string com máscara', () => {
		expect(normalizeDigitsOnly('12.345.678/0001-90')).toBe('12345678000190');
	});

	it('deve remover parênteses e espaços de telefone', () => {
		expect(normalizeDigitsOnly('(11) 98765-4321')).toBe('11987654321');
	});

	it('deve remover hífen de CEP', () => {
		expect(normalizeDigitsOnly('01310-100')).toBe('01310100');
	});

	it('deve retornar string vazia se não houver dígitos', () => {
		expect(normalizeDigitsOnly('abc-def')).toBe('');
	});
});

describe('normalizeEmail', () => {
	it('deve converter para minúsculas', () => {
		expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
	});

	it('deve fazer trim', () => {
		expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
	});
});
