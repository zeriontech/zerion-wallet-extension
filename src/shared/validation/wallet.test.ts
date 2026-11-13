import { HARDHAT_PHRASE, TEST_PHRASES } from 'src/shared/wallet/test-phrases';
import { isValidMnemonic, isValidPrivateKey } from './wallet';

const ABANDON_11 = Array(11).fill('abandon').join(' ');
const ABANDON_23 = Array(23).fill('abandon').join(' ');

describe('isValidMnemonic', () => {
  it('accepts valid 12- and 24-word phrases', () => {
    expect(isValidMnemonic(HARDHAT_PHRASE)).toBe(true);
    expect(isValidMnemonic(`${ABANDON_11} about`)).toBe(true);
    expect(isValidMnemonic(`${ABANDON_23} art`)).toBe(true);
  });

  it.each(Object.entries(TEST_PHRASES))('accepts the reference phrase: %s', (_name, phrase) => {
    expect(isValidMnemonic(phrase)).toBe(true);
  });

  it('accepts upper-case input', () => {
    expect(isValidMnemonic(HARDHAT_PHRASE.toUpperCase())).toBe(true);
  });

  it('rejects a wrong checksum, an unknown word and a wrong length', () => {
    expect(isValidMnemonic(`${ABANDON_11} abandon`)).toBe(false);
    expect(isValidMnemonic(HARDHAT_PHRASE.replace('junk', 'notaword'))).toBe(false);
    expect(isValidMnemonic(ABANDON_11)).toBe(false);
    expect(isValidMnemonic('')).toBe(false);
  });

  it('rejects surrounding spaces and separators other than a space', () => {
    expect(isValidMnemonic(` ${HARDHAT_PHRASE}`)).toBe(false);
    expect(isValidMnemonic(`${HARDHAT_PHRASE} `)).toBe(false);
    expect(isValidMnemonic(HARDHAT_PHRASE.replace(/ /g, '\n'))).toBe(false);
    expect(isValidMnemonic(HARDHAT_PHRASE.replace(/ /g, '\t'))).toBe(false);
  });

  it('gives the recorded answer for every variation of a phrase', () => {
    const words = HARDHAT_PHRASE.split(' ');
    const variations: Record<string, string> = {
      'as is': HARDHAT_PHRASE,
      'upper case': HARDHAT_PHRASE.toUpperCase(),
      'mixed case': 'Test tEst teSt tesT TEST test test test test test test JUNK',
      'two spaces between all words': words.join('  '),
      'two spaces between two words': HARDHAT_PHRASE.replace('test junk', 'test  junk'),
      'leading space': ` ${HARDHAT_PHRASE}`,
      'trailing space': `${HARDHAT_PHRASE} `,
      'trailing newline': `${HARDHAT_PHRASE}\n`,
      'tab separated': words.join('\t'),
      'newline separated': words.join('\n'),
      'carriage return and newline separated': words.join('\r\n'),
      'no-break space separated': words.join('\u00a0'),
      'ideographic space separated': words.join('\u3000'),
      'one tab among spaces': HARDHAT_PHRASE.replace('test junk', 'test\tjunk'),
      'comma separated': words.join(','),
      'comma and space separated': words.join(', '),
      'trailing full stop': `${HARDHAT_PHRASE}.`,
      'last word swapped (wrong checksum)': HARDHAT_PHRASE.replace('junk', 'test'),
      'two words swapped': 'junk test test test test test test test test test test test',
      'unknown word': HARDHAT_PHRASE.replace('junk', 'notaword'),
      'word with a typo': HARDHAT_PHRASE.replace('junk', 'junks'),
      'word with an accent': HARDHAT_PHRASE.replace('junk', 'júnk'),
      'first 11 words': words.slice(0, 11).join(' '),
      'one word repeated 13 times': `${HARDHAT_PHRASE} test`,
      'phrase twice (24 words)': `${HARDHAT_PHRASE} ${HARDHAT_PHRASE}`,
      '12 words, all abandon': `${ABANDON_11} abandon`,
      '25 words': `${ABANDON_23} art abandon`,
      'one word': 'test',
      'empty string': '',
      'one space': ' ',
      'a private key': `0x${'11'.repeat(32)}`,
      digits: '1 2 3 4 5 6 7 8 9 10 11 12',
      'spanish reference phrase':
        'ábaco ábaco ábaco ábaco ábaco ábaco ábaco ábaco ábaco ábaco ábaco abierto',
    };
    const table = Object.fromEntries(
      Object.entries(variations).map(([name, phrase]) => [name, isValidMnemonic(phrase)]),
    );
    expect(table).toMatchSnapshot();
  });
});

describe('isValidPrivateKey', () => {
  it('accepts a 32-byte hex key with or without the 0x prefix, ignoring surrounding spaces', () => {
    const key = 'ab'.repeat(32);
    expect(isValidPrivateKey(`0x${key}`)).toBe(true);
    expect(isValidPrivateKey(key)).toBe(true);
    expect(isValidPrivateKey(`  0x${key}\n`)).toBe(true);
  });

  it('rejects keys of the wrong length, non-hex input and recovery phrases', () => {
    expect(isValidPrivateKey(`0x${'ab'.repeat(31)}`)).toBe(false);
    expect(isValidPrivateKey(`0x${'ab'.repeat(33)}`)).toBe(false);
    expect(isValidPrivateKey(`0x${'zz'.repeat(32)}`)).toBe(false);
    expect(isValidPrivateKey('')).toBe(false);
    expect(isValidPrivateKey(HARDHAT_PHRASE)).toBe(false);
  });
});
