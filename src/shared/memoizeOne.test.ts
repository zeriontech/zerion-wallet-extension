import memoizeOne from './memoizeOne';

describe('memoizeOne', () => {
  test('reuses the result for the same arguments and recomputes for new ones', () => {
    let calls = 0;
    const fn = memoizeOne((a: number, b: number) => {
      calls += 1;
      return a + b;
    });

    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(calls).toBe(1);

    expect(fn(1, 3)).toBe(4);
    expect(calls).toBe(2);
  });

  test('compares arguments by identity, like memoize-one', () => {
    let calls = 0;
    const fn = memoizeOne((value: { n: number }) => {
      calls += 1;
      return value.n;
    });
    const first = { n: 1 };
    const second = { n: 1 };

    expect(fn(first)).toBe(1);
    expect(fn(first)).toBe(1);
    expect(calls).toBe(1);

    expect(fn(second)).toBe(1);
    expect(calls).toBe(2);
  });
});
