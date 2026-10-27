import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBrlCents } from '../src/shared/money/brl';

test('supplier and purchase amounts preserve cents for comma and canonical decimal input', () => {
  for (const [value, cents] of [['12,50', 1250], ['12.50', 1250], ['R$ 1.234,56', 123456], ['1.500', 150000], ['0,01', 1], ['0.10', 10], ['1250', 125000], ['0', 0]] as const) assert.equal(parseBrlCents(value), cents, value);
});
test('money input rejects negative, malformed, excess precision and unsafe values', () => {
  for (const value of ['', '-10', '1,234', '1.2.3', 'abc10', '1,2,3', 'NaN', '99999999999999999']) assert.equal(parseBrlCents(value), undefined, value);
});
