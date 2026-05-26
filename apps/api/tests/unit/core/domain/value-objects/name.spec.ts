import { describe, expect, it } from 'vitest';
import { Name } from '../../../../../src/core/domain/value-objects/name';

describe('Name', () => {
	it('deve normalizar nome removendo caracteres especiais', () => {
		const name = Name.fromRaw('  João   @Silva#  ');
		expect(name.value).toBe('João Silva');
	});

	it('deve remover emojis', () => {
		const name = Name.fromRaw('Maria 😀 Silva');
		expect(name.value).toBe('Maria Silva');
	});

	it('deve permitir letras acentuadas', () => {
		const name = Name.fromRaw('José María');
		expect(name.value).toBe('José María');
	});

	it('deve permitir hífen e apóstrofo', () => {
		const name = Name.fromRaw("Jean-Pierre D'Angelo");
		expect(name.value).toBe("Jean-Pierre D'Angelo");
	});

	it('deve colapsar espaços múltiplos', () => {
		const name = Name.fromRaw('Ana    Paula');
		expect(name.value).toBe('Ana Paula');
	});

	it('deve fazer trim', () => {
		const name = Name.fromRaw('  Carlos  ');
		expect(name.value).toBe('Carlos');
	});

	it('deve lançar se nome tiver menos de 2 caracteres após normalização', () => {
		expect(() => Name.fromRaw('A')).toThrow(
			'Nome deve ter pelo menos 2 caracteres após normalização',
		);
	});

	it('deve lançar se nome for apenas símbolos', () => {
		expect(() => Name.fromRaw('@@@!!!')).toThrow(
			'Nome deve ter pelo menos 2 caracteres após normalização',
		);
	});
});
