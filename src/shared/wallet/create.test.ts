import { ethers } from 'ethers';
import { isValidMnemonic } from 'src/shared/validation/wallet';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { generateWalletsForEcosystems, restoreBareWallet, walletToObject } from './create';
import { HARDHAT_ADDRESSES, HARDHAT_PHRASE, TEST_PHRASES } from './test-phrases';

const DEFAULT_PATH = "m/44'/60'/0'/0/0";
const [ACCOUNT_0, ACCOUNT_1] = HARDHAT_ADDRESSES;

/** Derivation is slow in the old implementation; these tests derive hundreds of keys */
const SLOW = 120_000;

function expectKeyControlsAddress(wallet: BareWallet) {
  expect(wallet.privateKey).toMatch(/^0x[0-9a-f]{64}$/);
  expect(new ethers.Wallet(wallet.privateKey).address).toBe(wallet.address);
}

function keyControlsAddress(wallet: BareWallet) {
  try {
    return new ethers.Wallet(wallet.privateKey).address === wallet.address;
  } catch {
    return false;
  }
}

/** The outcome without key material, so that it can be recorded in a snapshot */
function outcome(input: Parameters<typeof restoreBareWallet>[0]) {
  let wallet: BareWallet;
  try {
    wallet = restoreBareWallet(input);
  } catch {
    return 'throws';
  }
  return {
    address: wallet.address,
    phrase: wallet.mnemonic?.phrase ?? null,
    path: wallet.mnemonic?.path ?? null,
    name: wallet.name,
    keyControlsAddress: keyControlsAddress(wallet),
    keyIsLowerCaseHex: /^0x[0-9a-f]{64}$/.test(wallet.privateKey),
  };
}

describe('restoreBareWallet', () => {
  it('derives an EVM wallet from a phrase and a path', () => {
    const wallet = restoreBareWallet({ mnemonic: { phrase: HARDHAT_PHRASE, path: DEFAULT_PATH } });
    expect(wallet.address).toBe(ACCOUNT_0);
    expect(wallet.mnemonic).toMatchObject({ phrase: HARDHAT_PHRASE, path: DEFAULT_PATH });
    expect(wallet.name).toBeNull();
    expect(new ethers.Wallet(wallet.privateKey).address).toBe(ACCOUNT_0);
  });

  it('uses the given path, not the default one', () => {
    const wallet = restoreBareWallet({
      mnemonic: { phrase: HARDHAT_PHRASE, path: "m/44'/60'/0'/0/1" },
    });
    expect(wallet.address).toBe(ACCOUNT_1);
    expect(wallet.mnemonic).toMatchObject({ path: "m/44'/60'/0'/0/1" });
  });

  it('stores the phrase in normalised form', () => {
    const wallet = restoreBareWallet({
      mnemonic: { phrase: HARDHAT_PHRASE.toUpperCase(), path: DEFAULT_PATH },
    });
    expect(wallet.address).toBe(ACCOUNT_0);
    expect(wallet.mnemonic?.phrase).toBe(HARDHAT_PHRASE);
  });

  it('restores an EVM wallet from a private key alone', () => {
    const { privateKey } = restoreBareWallet({
      mnemonic: { phrase: HARDHAT_PHRASE, path: DEFAULT_PATH },
    });
    const wallet = restoreBareWallet({ privateKey });
    expect(wallet.address).toBe(ACCOUNT_0);
    expect(wallet.privateKey).toBe(privateKey);
    expect(wallet.mnemonic).toBeNull();
    expect(wallet.name).toBeNull();
  });

  it('returns a stored wallet as it is, without deriving anything', () => {
    const stored = {
      address: '0x0000000000000000000000000000000000000001',
      privateKey: 'not-a-real-key',
      mnemonic: null,
      name: 'Main',
    };
    expect(restoreBareWallet(stored)).toEqual(stored);
    const withPhrase = { ...stored, mnemonic: { phrase: 'encrypted', path: DEFAULT_PATH } };
    expect(restoreBareWallet(withPhrase)).toEqual(withPhrase);
    expect(restoreBareWallet({ address: stored.address, privateKey: stored.privateKey })).toEqual({
      ...stored,
      name: null,
    });
  });

  it('creates a random 12-word wallet on the default path when given nothing', () => {
    const wallet = restoreBareWallet({});
    expect(wallet.mnemonic?.path).toBe(DEFAULT_PATH);
    expect(wallet.mnemonic?.phrase.split(' ')).toHaveLength(12);
    expect(isValidMnemonic(wallet.mnemonic?.phrase ?? '')).toBe(true);
    expect(wallet.name).toBeNull();
    expectKeyControlsAddress(wallet);
    const again = restoreBareWallet({ mnemonic: wallet.mnemonic ?? undefined });
    expect(again.address).toBe(wallet.address);
    expect(again.privateKey).toBe(wallet.privateKey);
  });

  it(
    'creates a different, valid, re-derivable wallet every time',
    () => {
      const wallets = Array.from({ length: 25 }, () => restoreBareWallet({}));
      expect(new Set(wallets.map((wallet) => wallet.address)).size).toBe(25);
      expect(new Set(wallets.map((wallet) => wallet.mnemonic?.phrase)).size).toBe(25);
      for (const wallet of wallets) {
        const phrase = wallet.mnemonic?.phrase ?? '';
        expect(phrase).toBe(phrase.toLowerCase());
        expect(phrase.split(' ')).toHaveLength(12);
        expect(isValidMnemonic(phrase)).toBe(true);
        expect(restoreBareWallet({ mnemonic: wallet.mnemonic ?? undefined }).address).toBe(
          wallet.address,
        );
      }
    },
    SLOW,
  );

  describe('recorded derivations', () => {
    const paths = [
      DEFAULT_PATH,
      "m/44'/60'/0'/0/1",
      "m/44'/60'/0'/0/2",
      "m/44'/60'/0'/0/10",
      "m/44'/60'/0'/0/29",
      "m/44'/60'/0'/0/100",
      "m/44'/60'/1'/0/0",
      "m/44'/60'/5'/0/0",
      "m/44'/60'/0'/1",
      "m/44'/60'/0'/5",
      "m/44'/60'/0'/0/0'",
      "m/44'/60'/0'",
      "m/44'/1'/0'/0/0",
    ];

    it.each(Object.entries(TEST_PHRASES))(
      'derives the recorded address on every path: %s',
      (_name, phrase) => {
        const table = Object.fromEntries(
          paths.map((path) => [path, outcome({ mnemonic: { phrase, path } })]),
        );
        for (const [path, result] of Object.entries(table)) {
          expect(result).toMatchObject({
            phrase,
            path,
            name: null,
            keyControlsAddress: true,
            keyIsLowerCaseHex: true,
          });
        }
        expect(table).toMatchSnapshot();
      },
      SLOW,
    );

    it('gives the recorded outcome for unusual paths', () => {
      const unusual = [
        'm',
        "44'/60'/0'/0/0",
        "/44'/60'/0'/0/0",
        "m/44'/60'/0'/0/0/",
        'm/44h/60h/0h/0/0',
        "M/44'/60'/0'/0/0",
        "m/44'/60'/0'/0/-1",
        "m/44'/60'/0'/0/2147483648",
        "m/44'/60'/0'/0/abc",
        "m/44'/60'/0'/0/ 0",
        'abc',
      ];
      const table = Object.fromEntries(
        unusual.map((path) => [
          JSON.stringify(path),
          outcome({ mnemonic: { phrase: HARDHAT_PHRASE, path } }),
        ]),
      );
      expect(table).toMatchSnapshot();
    });

    it('gives the recorded outcome for every variation of the phrase', () => {
      const words = HARDHAT_PHRASE.split(' ');
      const variations: Record<string, string> = {
        'as is': HARDHAT_PHRASE,
        'upper case': HARDHAT_PHRASE.toUpperCase(),
        'mixed case': 'Test tEst teSt tesT TEST test test test test test test JUNK',
        'two spaces between all words': words.join('  '),
        'leading space': ` ${HARDHAT_PHRASE}`,
        'trailing space': `${HARDHAT_PHRASE} `,
        'trailing newline': `${HARDHAT_PHRASE}\n`,
        'tab separated': words.join('\t'),
        'newline separated': words.join('\n'),
        'no-break space separated': words.join('\u00a0'),
        'ideographic space separated': words.join('\u3000'),
        'comma separated': words.join(','),
        'last word swapped (wrong checksum)': HARDHAT_PHRASE.replace('junk', 'test'),
        'unknown word': HARDHAT_PHRASE.replace('junk', 'notaword'),
        'first 11 words': words.slice(0, 11).join(' '),
        'one word': 'test',
      };
      const table = Object.fromEntries(
        Object.entries(variations).map(([name, phrase]) => [
          name,
          outcome({ mnemonic: { phrase, path: DEFAULT_PATH } }),
        ]),
      );
      expect(table).toMatchSnapshot();
    });

    it('gives the recorded outcome for every way of writing a private key', () => {
      const { privateKey } = restoreBareWallet({
        mnemonic: { phrase: HARDHAT_PHRASE, path: DEFAULT_PATH },
      });
      const digits = privateKey.slice(2);
      const variations: Record<string, string> = {
        'as derived': privateKey,
        'upper-case digits': `0x${digits.toUpperCase()}`,
        'upper-case prefix': `0X${digits}`,
        'without prefix': digits,
        'leading space': ` ${privateKey}`,
        'trailing space': `${privateKey} `,
        'one byte short': privateKey.slice(0, -2),
        'one digit short': privateKey.slice(0, -1),
        'one byte long': `${privateKey}00`,
        'not hex': `0x${'zz'}${digits.slice(2)}`,
        'zero key': `0x${'00'.repeat(32)}`,
        'key equal to the curve order':
          '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
        'largest valid key': '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140',
        'smallest valid key': `0x${'00'.repeat(31)}01`,
        'a recovery phrase': HARDHAT_PHRASE,
      };
      const table = Object.fromEntries(
        Object.entries(variations).map(([name, value]) => [name, outcome({ privateKey: value })]),
      );
      expect(table['as derived']).toMatchObject({
        address: ACCOUNT_0,
        phrase: null,
        path: null,
        keyControlsAddress: true,
      });
      expect(table).toMatchSnapshot();
    });
  });
});

describe('generateWalletsForEcosystems', () => {
  it('derives the EVM and Solana wallets from one phrase, EVM first', () => {
    const [evm, solana] = generateWalletsForEcosystems(['solana', 'evm']);
    expect(evm.mnemonic.path).toBe(DEFAULT_PATH);
    expect(solana.mnemonic.path).toBe("m/44'/501'/0'/0'");
    expect(solana.mnemonic.phrase).toBe(evm.mnemonic.phrase);
    expect(restoreBareWallet({ mnemonic: evm.mnemonic }).address).toBe(evm.address);
    expect(restoreBareWallet({ mnemonic: solana.mnemonic }).address).toBe(solana.address);
  });

  it('creates only the requested ecosystems', () => {
    const evmOnly = generateWalletsForEcosystems(['evm']);
    expect(evmOnly).toHaveLength(1);
    expect(evmOnly[0].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(evmOnly[0].mnemonic.path).toBe(DEFAULT_PATH);
    expect(evmOnly[0].name).toBeNull();
    expectKeyControlsAddress(evmOnly[0]);

    const solanaOnly = generateWalletsForEcosystems(['solana']);
    expect(solanaOnly).toHaveLength(1);
    expect(solanaOnly[0].address).not.toMatch(/^0x/);
    expect(solanaOnly[0].mnemonic.path).toBe("m/44'/501'/0'/0'");
  });

  it(
    'creates a valid 12-word phrase that is new every time',
    () => {
      const phrases = Array.from(
        { length: 10 },
        () => generateWalletsForEcosystems(['evm'])[0].mnemonic.phrase,
      );
      expect(new Set(phrases).size).toBe(10);
      for (const phrase of phrases) {
        expect(phrase.split(' ')).toHaveLength(12);
        expect(isValidMnemonic(phrase)).toBe(true);
      }
    },
    SLOW,
  );

  it('refuses an empty list and an unknown ecosystem', () => {
    expect(() => generateWalletsForEcosystems([])).toThrow();
    expect(() =>
      generateWalletsForEcosystems(['bitcoin'] as unknown as Parameters<
        typeof generateWalletsForEcosystems
      >[0]),
    ).toThrow();
  });
});

describe('walletToObject', () => {
  it('copies exactly the four stored fields of a wallet', () => {
    const wallet = {
      address: ACCOUNT_0,
      privateKey: 'encrypted',
      mnemonic: { phrase: 'encrypted', path: DEFAULT_PATH },
      name: 'Main',
      extra: 'not stored',
    };
    const result = walletToObject(wallet);
    expect(result).toEqual({
      address: ACCOUNT_0,
      privateKey: 'encrypted',
      mnemonic: { phrase: 'encrypted', path: DEFAULT_PATH },
      name: 'Main',
    });
    expect(result).not.toBe(wallet);
    expect(walletToObject({ ...wallet, mnemonic: null, name: null })).toEqual({
      address: ACCOUNT_0,
      privateKey: 'encrypted',
      mnemonic: null,
      name: null,
    });
  });
});
