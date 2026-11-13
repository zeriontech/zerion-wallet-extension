import { ethers } from 'ethers';
import { decodeMasked, encodeForMasking } from 'src/shared/wallet/encode-locally';
import { HARDHAT_ADDRESSES, HARDHAT_PHRASE, TEST_PHRASES } from 'src/shared/wallet/test-phrases';
import type { Params, Result } from './getFirstNMnemonicWallets.worker';

/** Derivation is slow in the old implementation; these tests derive hundreds of keys */
const SLOW = 120_000;

interface WorkerScope {
  onmessage: ((event: { data: Params }) => void) | null;
  postMessage: (value: unknown) => void;
}

/**
 * Runs the real worker module: it registers `onmessage` when it is imported
 * and answers through `postMessage`, exactly as the import screen uses it.
 */
async function runWorker(params: Omit<Params, 'phrase'> & { phrase: string }): Promise<Result> {
  const scope = globalThis as unknown as WorkerScope;
  const posted: Result[] = [];
  scope.postMessage = (value) => {
    posted.push(value as Result);
  };
  await import('./getFirstNMnemonicWallets.worker');
  if (!scope.onmessage) {
    throw new Error('The worker did not register onmessage');
  }
  scope.onmessage({ data: { ...params, phrase: encodeForMasking(params.phrase) } });
  expect(posted).toHaveLength(1);
  return posted[0];
}

async function outcome(params: Omit<Params, 'phrase'> & { phrase: string }) {
  let wallets: Result;
  try {
    wallets = await runWorker(params);
  } catch {
    return 'throws';
  }
  return wallets.map((wallet) => ({
    address: wallet.address,
    phrase: wallet.mnemonic ? decodeMasked(wallet.mnemonic.phrase) : null,
    path: wallet.mnemonic?.path ?? null,
    name: wallet.name,
  }));
}

describe('mnemonic import worker: EVM accounts', () => {
  it('derives the published first accounts of the development phrase', async () => {
    const wallets = await runWorker({ curve: 'ecdsa', phrase: HARDHAT_PHRASE, n: 3 });
    expect(wallets.map((wallet) => wallet.address)).toEqual(HARDHAT_ADDRESSES);
  });

  it('returns nothing for n = 0', async () => {
    expect(await runWorker({ curve: 'ecdsa', phrase: HARDHAT_PHRASE, n: 0 })).toEqual([]);
  });

  it('masks the phrase and the private key it returns', async () => {
    const [wallet] = await runWorker({ curve: 'ecdsa', phrase: HARDHAT_PHRASE, n: 1 });
    expect(wallet.mnemonic?.phrase).toBe(encodeForMasking(HARDHAT_PHRASE));
    expect(wallet.mnemonic?.phrase).not.toBe(HARDHAT_PHRASE);
    const privateKey = decodeMasked(wallet.privateKey);
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/);
    expect(wallet.privateKey).toBe(encodeForMasking(privateKey));
    expect(wallet.privateKey).not.toBe(privateKey);
  });

  it.each(Object.entries(TEST_PHRASES))(
    'returns 30 accounts on consecutive paths, each with the phrase and a key that controls it: %s',
    async (_name, phrase) => {
      const wallets = await runWorker({ curve: 'ecdsa', phrase, n: 30 });
      expect(wallets).toHaveLength(30);
      wallets.forEach((wallet, index) => {
        expect(wallet.mnemonic?.path).toBe(`m/44'/60'/0'/0/${index}`);
        expect(wallet.mnemonic ? decodeMasked(wallet.mnemonic.phrase) : null).toBe(phrase);
        expect(wallet.name).toBeNull();
        const privateKey = decodeMasked(wallet.privateKey);
        expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/);
        expect(new ethers.Wallet(privateKey).address).toBe(wallet.address);
      });
      expect(new Set(wallets.map((wallet) => wallet.address)).size).toBe(30);
      expect(wallets.map((wallet) => wallet.address)).toMatchSnapshot();
    },
    SLOW,
  );

  it('gives the recorded outcome for every variation of the phrase', async () => {
    const words = HARDHAT_PHRASE.split(' ');
    const variations: Record<string, string> = {
      'as is': HARDHAT_PHRASE,
      'upper case': HARDHAT_PHRASE.toUpperCase(),
      'two spaces between all words': words.join('  '),
      'leading space': ` ${HARDHAT_PHRASE}`,
      'trailing space': `${HARDHAT_PHRASE} `,
      'tab separated': words.join('\t'),
      'newline separated': words.join('\n'),
      'no-break space separated': words.join('\u00a0'),
      'last word swapped (wrong checksum)': HARDHAT_PHRASE.replace('junk', 'test'),
      'unknown word': HARDHAT_PHRASE.replace('junk', 'notaword'),
      'first 11 words': words.slice(0, 11).join(' '),
      'empty string': '',
    };
    const table: Record<string, unknown> = {};
    for (const [name, phrase] of Object.entries(variations)) {
      table[name] = await outcome({ curve: 'ecdsa', phrase, n: 2 });
    }
    expect(table).toMatchSnapshot();
  });
});

describe('mnemonic import worker: Solana accounts and errors', () => {
  it('gives the recorded Solana accounts for every path type', async () => {
    const table: Record<string, unknown> = {};
    for (const pathType of ['solanaBip44Change', 'solanaBip44', 'solanaDeprecated'] as const) {
      table[pathType] = await outcome({ curve: 'ed25519', phrase: HARDHAT_PHRASE, n: 3, pathType });
    }
    table['default path type'] = await outcome({ curve: 'ed25519', phrase: HARDHAT_PHRASE, n: 3 });
    expect(table).toMatchSnapshot();
  });

  it('rejects an unknown curve', async () => {
    const params = { curve: 'secp256r1', phrase: HARDHAT_PHRASE, n: 1 } as unknown as Omit<
      Params,
      'phrase'
    > & { phrase: string };
    await expect(runWorker(params)).rejects.toThrow();
  });
});
