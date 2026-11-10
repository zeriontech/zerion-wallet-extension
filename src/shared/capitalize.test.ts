import { capitalize } from './capitalize';

describe('capitalize', () => {
  test('uppercases only the first character', () => {
    expect(capitalize('hello World')).toBe('Hello World');
    expect(capitalize('ÉCLAIR')).toBe('ÉCLAIR');
    expect(capitalize('')).toBe('');
  });
});
