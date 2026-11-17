import { normalizeChainId } from './normalizeChainId';

type Input = Parameters<typeof normalizeChainId>[0];

function outcome(value: unknown): string {
  try {
    return `returns ${JSON.stringify(normalizeChainId(value as Input))}`;
  } catch {
    return 'throws';
  }
}

function label(value: unknown): string {
  if (typeof value === 'bigint') {
    return `${value}n`;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value === undefined) {
    return 'undefined';
  }
  return JSON.stringify(value);
}

test('normalizeChainId', () => {
  expect(normalizeChainId(137)).toBe('0x89');
  expect(normalizeChainId('137')).toBe('0x89');
  expect(normalizeChainId('0x89')).toBe('0x89');

  expect(normalizeChainId(1)).toBe('0x1');
  expect(normalizeChainId('1')).toBe('0x1');
  expect(normalizeChainId('0x1')).toBe('0x1');

  expect(normalizeChainId(42161)).toBe('0xa4b1');
  expect(normalizeChainId('42161')).toBe('0xa4b1');
  expect(normalizeChainId('0xa4b1')).toBe('0xa4b1');

  expect(normalizeChainId(' 1')).toBe('0x1');
  expect(normalizeChainId('1 ')).toBe('0x1');
  expect(normalizeChainId(' 0x89 ')).toBe('0x89');
});

test('normalizeChainId agrees with BigInt for every chain id from 0 to 5000 and for large ids', () => {
  const ids = [...Array(5001).keys()].map(BigInt);
  ids.push(42161n, 8453n, 59144n, 534352n, 11155111n, 1313161554n, 2n ** 53n - 2n, 2n ** 64n);
  for (const id of ids) {
    const expected = `0x${id.toString(16)}`;
    expect(normalizeChainId(id)).toBe(expected);
    expect(normalizeChainId(id.toString())).toBe(expected);
    expect(normalizeChainId(` ${id.toString()} `)).toBe(expected);
    expect(normalizeChainId(expected)).toBe(expected);
    expect(normalizeChainId(expected.toUpperCase().replace('0X', '0x'))).toBe(expected);
    if (id < 2n ** 53n - 2n) {
      expect(normalizeChainId(Number(id))).toBe(expected);
    }
  }
});

test('normalizeChainId gives the recorded outcome for every input', () => {
  const stored = (hex: unknown) => ({ _hex: hex, _isBigNumber: true });
  const cases: unknown[] = [
    0,
    1,
    137,
    -1,
    1.5,
    Number.NaN,
    Number.MAX_SAFE_INTEGER,
    0n,
    1n,
    -1n,
    2n ** 64n,
    '0',
    '1',
    '-1',
    '1.5',
    '',
    ' ',
    'abc',
    '0x',
    ' 0x ',
    '0x0',
    '0x00',
    '0x0A',
    '0X89',
    ' 0XA4B1 ',
    '0xA4B1',
    '0xg',
    '\t1\n',
    stored('0x01'),
    stored('0x0849ea'),
    stored('0xA4B1'),
    stored('0x'),
    stored(1),
    null,
    undefined,
    true,
    [],
    [1],
    {},
  ];
  const labels = cases.map(label);
  expect(new Set(labels).size).toBe(labels.length);
  expect(
    Object.fromEntries(cases.map((value) => [label(value), outcome(value)])),
  ).toMatchSnapshot();
});
