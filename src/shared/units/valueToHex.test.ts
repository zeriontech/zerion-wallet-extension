import { valueToHex } from './valueToHex';

type Input = Parameters<typeof valueToHex>[0];

/**
 * `valueToHex` receives transaction fields from dapps and from browser storage,
 * so it is exercised with values its parameter type would reject as well.
 */
function outcome(value: unknown, transformEmptyString?: boolean): string {
  try {
    return `returns ${JSON.stringify(valueToHex(value as Input, transformEmptyString))}`;
  } catch {
    return 'throws';
  }
}

function label(value: unknown): string {
  if (typeof value === 'bigint') {
    return `${value}n`;
  }
  if (typeof value === 'number') {
    return Object.is(value, -0) ? '-0' : String(value);
  }
  if (value instanceof Uint8Array) {
    return `Uint8Array[${Array.from(value).join(',')}]`;
  }
  if (value === undefined) {
    return 'undefined';
  }
  return JSON.stringify(value);
}

/** A number in the shape ethers v5 left in browser storage */
function stored(hex: unknown, flag: unknown = true) {
  return { _hex: hex, _isBigNumber: flag };
}

function evenLengthHex(value: bigint) {
  const digits = value.toString(16);
  return `0x${digits.length % 2 ? '0' : ''}${digits}`;
}

/** Deterministic non-negative integers of every size up to 256 bits */
function generateIntegers(count: number): bigint[] {
  const MASK_64 = 2n ** 64n - 1n;
  let state = 0x9e3779b97f4a7c15n;
  const next = () => {
    state = (state * 6364136223846793005n + 1442695040888963407n) & MASK_64;
    return state;
  };
  const result: bigint[] = [];
  for (let i = 0; i < count; i++) {
    const wide = (next() << 192n) | (next() << 128n) | (next() << 64n) | next();
    result.push(wide >> (next() % 256n));
  }
  return result;
}

const NUMBERS: unknown[] = [
  0,
  -0,
  1,
  15,
  16,
  255,
  256,
  21000,
  2 ** 31,
  2 ** 32,
  2 ** 53 - 2,
  Number.MAX_SAFE_INTEGER,
  2 ** 53,
  1e21,
  -1,
  0.5,
  1.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
];

const BIGINTS: unknown[] = [0n, 1n, 255n, 2n ** 64n, 2n ** 256n - 1n, 2n ** 256n, -1n];

const DECIMAL_STRINGS: unknown[] = [
  '0',
  '1',
  '007',
  '137',
  '21000',
  '1000000000000000000',
  (2n ** 256n - 1n).toString(),
  '-1',
  '-0',
  '+1',
  '1.0',
  '1.5',
  '1e3',
  ' 1',
  '1 ',
  '1 000',
  '1_000',
  '1n',
];

const HEX_STRINGS: unknown[] = [
  '0x',
  '0x0',
  '0x00',
  '0x1',
  '0x01',
  '0xa',
  '0xA',
  '0xabcdef',
  '0xABCDEF',
  '0x0abc',
  '0x0849ea',
  '0X1A',
  '0xg1',
  '0x-1',
  '-0x1',
  '0x 1',
  ' 0x1',
  '0x1 ',
];

const OTHER_STRINGS: unknown[] = [
  '',
  'abc',
  'null',
  'undefined',
  'true',
  '0b11',
  '0o17',
  '١٢٣',
  '１２３',
];

const STORED_NUMBERS: unknown[] = [
  stored('0x00'),
  stored('0x01'),
  stored('0x1'),
  stored('0x0001'),
  stored('0x0849ea'),
  stored('0x0de0b6b3a7640000'),
  stored('0xABCDEF'),
  stored('0x'),
  stored('-0x01'),
  stored('0xzz'),
  stored('12'),
  stored(5),
  stored(undefined),
  stored(null),
  stored('0x01', false),
  stored('0x01', 1),
  { _hex: '0x01' },
  { type: 'BigNumber', hex: '0x01' },
  {},
];

const OTHER_VALUES: unknown[] = [
  null,
  undefined,
  true,
  false,
  [],
  [0],
  [1, 2],
  [256],
  ['1'],
  new Uint8Array([]),
  new Uint8Array([1, 2]),
  new Uint8Array([0, 0, 1]),
];

const CASES: unknown[] = [
  ...NUMBERS,
  ...BIGINTS,
  ...DECIMAL_STRINGS,
  ...HEX_STRINGS,
  ...OTHER_STRINGS,
  ...STORED_NUMBERS,
  ...OTHER_VALUES,
];

describe('valueToHex', () => {
  it('returns hex strings unchanged, without normalising them', () => {
    expect(valueToHex('0x89')).toBe('0x89');
    expect(valueToHex('0x0abc')).toBe('0x0abc');
    expect(valueToHex('0xABCDEF')).toBe('0xABCDEF');
    expect(valueToHex('0x')).toBe('0x');
    expect(valueToHex('0x0')).toBe('0x0');
  });

  it('converts decimal strings, numbers and bigints to minimal hex', () => {
    expect(valueToHex('137')).toBe('0x89');
    expect(valueToHex(137)).toBe('0x89');
    expect(valueToHex(137n)).toBe('0x89');
    expect(valueToHex('0')).toBe('0x0');
    expect(valueToHex(0)).toBe('0x0');
    expect(valueToHex(0n)).toBe('0x0');
    expect(valueToHex(21000)).toBe('0x5208');
    expect(valueToHex('007')).toBe('0x7');
  });

  it('keeps precision beyond 2^53 for strings and bigints', () => {
    expect(valueToHex('1000000000000000000')).toBe('0xde0b6b3a7640000');
    expect(valueToHex(1000000000000000000n)).toBe('0xde0b6b3a7640000');
    expect(valueToHex((2n ** 256n - 1n).toString())).toBe(`0x${'f'.repeat(64)}`);
  });

  it('reads a number that ethers v5 wrote into storage', () => {
    expect(valueToHex(stored('0x0849ea') as unknown as Input)).toBe('0x849ea');
    expect(valueToHex(stored('0x00') as unknown as Input)).toBe('0x0');
  });

  it('handles the empty string as configured', () => {
    expect(valueToHex('')).toBe('');
    expect(valueToHex('', false)).toBe('');
    expect(valueToHex('', true)).toBe('0x');
  });

  it('throws on values that are not non-negative integers', () => {
    expect(() => valueToHex('abc')).toThrow();
    expect(() => valueToHex('1.5')).toThrow();
    expect(() => valueToHex('1e3')).toThrow();
    expect(() => valueToHex(' 1')).toThrow();
    expect(() => valueToHex('-1')).toThrow();
    expect(() => valueToHex(-1)).toThrow();
    expect(() => valueToHex(1.5)).toThrow();
    expect(() => valueToHex(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => valueToHex(-1n)).toThrow();
  });

  it('maps NaN to zero', () => {
    expect(valueToHex(Number.NaN)).toBe('0x0');
  });

  describe('against BigInt as an independent reference', () => {
    const integers = generateIntegers(2000);

    it('converts generated bigints, decimal strings and stored numbers to the same minimal hex', () => {
      for (const integer of integers) {
        const expected = `0x${integer.toString(16)}`;
        expect(valueToHex(integer)).toBe(expected);
        expect(valueToHex(integer.toString())).toBe(expected);
        expect(valueToHex(stored(evenLengthHex(integer)) as unknown as Input)).toBe(expected);
      }
    });

    it('converts generated safe integers given as numbers', () => {
      for (const integer of integers) {
        const safe = Number(integer % BigInt(Number.MAX_SAFE_INTEGER - 1));
        expect(valueToHex(safe)).toBe(`0x${safe.toString(16)}`);
      }
    });

    it('returns generated hex strings unchanged, padded or not', () => {
      for (const integer of integers) {
        const minimal = `0x${integer.toString(16)}`;
        const padded = `0x000${integer.toString(16).toUpperCase()}`;
        expect(valueToHex(minimal)).toBe(minimal);
        expect(valueToHex(padded)).toBe(padded);
      }
    });

    it('round-trips: the result always parses back to the input', () => {
      for (const integer of integers) {
        expect(BigInt(valueToHex(integer.toString()))).toBe(integer);
      }
    });
  });

  describe('recorded behaviour', () => {
    it('labels every case uniquely', () => {
      const labels = CASES.map(label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('gives the recorded outcome for every input', () => {
      const table = Object.fromEntries(CASES.map((value) => [label(value), outcome(value)]));
      expect(table).toMatchSnapshot();
    });

    it('gives the recorded outcome when transformEmptyString is set', () => {
      const inputs: unknown[] = ['', '0x', '0', '1', 'abc', 0, null, undefined];
      const table = Object.fromEntries(inputs.map((value) => [label(value), outcome(value, true)]));
      expect(table).toMatchSnapshot();
    });
  });
});
