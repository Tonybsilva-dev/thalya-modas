/** Accept BRL formatting and canonical decimal input without losing cents. */
export function parseBrlCents(input: string): number | undefined {
  const value = input.trim().replace(/^R\$\s*/, '').replace(/[\s\u00a0]/g, '');
  let normalized: string;
  if (value.includes(',')) {
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(value)) return undefined;
    normalized = value.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(value)) {
    normalized = value.replace(/\./g, '');
  } else {
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return undefined;
    normalized = value;
  }
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : undefined;
}
