import { normalizedContains } from './normalizedContains';

describe('normalizedContains', () => {
  test('ignores diacritics', () => {
    expect(normalizedContains('Curaçao', 'Curacao')).toBe(true);
    expect(normalizedContains('Åland Islands', 'Aland')).toBe(true);
  });

  test('keeps the original case-sensitive behavior', () => {
    expect(normalizedContains('Curaçao', 'curaçao')).toBe(false);
  });
});
