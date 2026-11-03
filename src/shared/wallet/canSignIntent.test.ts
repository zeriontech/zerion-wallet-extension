import { afterEach, describe, expect, test } from '@jest/globals';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import type { Quote2 } from 'src/shared/types/Quote';
import { filterQuotesByIntentCapability } from 'src/shared/types/Quote';
import { SeedType } from 'src/shared/SeedType';
import {
  isHardwareContainer,
  isMnemonicContainer,
  isPrivateKeyContainer,
  isReadonlyContainer,
} from 'src/shared/types/validators';
import { LEDGER_INTENT_ECOSYSTEMS, canSignIntent } from './canSignIntent';
import { BLOCKCHAIN_TYPES, type BlockchainType } from './classifiers';

const ADDRESS: Record<BlockchainType, string> = {
  evm: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
  solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
};

type WalletKind = 'readonly' | 'mnemonic' | 'private key' | 'Ledger';

function makeGroup(
  kind: WalletKind,
  address: string,
  id: string = kind
): WalletGroup {
  const wallets =
    kind === 'Ledger'
      ? [{ address, name: null, derivationPath: "m/44'/60'/0'/0/0" }]
      : kind === 'readonly'
      ? [{ address, name: null }]
      : [
          {
            address,
            name: null,
            mnemonic:
              kind === 'mnemonic'
                ? { phrase: 'masked', path: "m/44'/60'/0'/0/0" }
                : null,
            privateKey: 'masked',
          },
        ];
  const container =
    kind === 'mnemonic'
      ? { seedType: SeedType.mnemonic, wallets }
      : kind === 'private key'
      ? { seedType: SeedType.privateKey, wallets }
      : kind === 'Ledger'
      ? { device: { productId: 1 }, provider: 'ledger', wallets }
      : { provider: null, wallets };
  return {
    id,
    walletContainer: container,
    name: id,
    lastBackedUp: null,
    origin: null,
    created: 0,
  } as unknown as WalletGroup;
}

const KINDS: WalletKind[] = ['readonly', 'mnemonic', 'private key', 'Ledger'];

const EXPECTED: Record<WalletKind, Record<BlockchainType, boolean>> = {
  readonly: { evm: false, solana: false },
  mnemonic: { evm: true, solana: true },
  'private key': { evm: true, solana: true },
  Ledger: { evm: true, solana: true },
};

const cases = KINDS.flatMap((kind) =>
  BLOCKCHAIN_TYPES.map((ecosystem) => [kind, ecosystem] as const)
);

describe('canSignIntent', () => {
  afterEach(() => {
    LEDGER_INTENT_ECOSYSTEMS.evm = true;
    LEDGER_INTENT_ECOSYSTEMS.solana = true;
  });

  test('fixtures are the container kinds they claim to be', () => {
    const container = (kind: WalletKind) =>
      makeGroup(kind, ADDRESS.evm).walletContainer;
    expect(isReadonlyContainer(container('readonly'))).toBe(true);
    expect(isMnemonicContainer(container('mnemonic'))).toBe(true);
    expect(isPrivateKeyContainer(container('private key'))).toBe(true);
    expect(isHardwareContainer(container('Ledger'))).toBe(true);
  });

  test('the Ledger constant ships enabled on both ecosystems', () => {
    expect(LEDGER_INTENT_ECOSYSTEMS).toEqual({ evm: true, solana: true });
  });

  test('covers 4 wallet kinds × 2 ecosystems', () => {
    expect(cases).toHaveLength(8);
  });

  test.each(cases)('%s wallet on %s', (kind, ecosystem) => {
    expect(
      canSignIntent({
        walletGroups: [makeGroup(kind, ADDRESS[ecosystem])],
        from: ADDRESS[ecosystem],
        ecosystem,
      })
    ).toBe(EXPECTED[kind][ecosystem]);
  });

  test('LEDGER_INTENT_ECOSYSTEMS.solana = false turns off Ledger Solana and nothing else', () => {
    LEDGER_INTENT_ECOSYSTEMS.solana = false;
    for (const [kind, ecosystem] of cases) {
      const expected =
        kind === 'Ledger' && ecosystem === 'solana'
          ? false
          : EXPECTED[kind][ecosystem];
      expect(
        canSignIntent({
          walletGroups: [makeGroup(kind, ADDRESS[ecosystem])],
          from: ADDRESS[ecosystem],
          ecosystem,
        })
      ).toBe(expected);
    }

    const intentQuote = { quoteId: 'q-1', intentSwap: {} } as Quote2;
    const classicQuote = { quoteId: '', intentSwap: null } as Quote2;
    const quotes = [intentQuote, classicQuote];
    const allowFor = (kind: WalletKind, ecosystem: BlockchainType) =>
      canSignIntent({
        walletGroups: [makeGroup(kind, ADDRESS[ecosystem])],
        from: ADDRESS[ecosystem],
        ecosystem,
      });
    expect(
      filterQuotesByIntentCapability(quotes, allowFor('Ledger', 'solana'))
    ).toEqual([classicQuote]);
    expect(
      filterQuotesByIntentCapability(quotes, allowFor('Ledger', 'evm'))
    ).toEqual(quotes);
    expect(
      filterQuotesByIntentCapability(quotes, allowFor('mnemonic', 'solana'))
    ).toEqual(quotes);
  });

  test('a from whose casing differs from the stored address still resolves the wallet', () => {
    const stored = '0x42B9dF65B219B3dD36ff330A4dD8f327A6Ada990';
    expect(
      canSignIntent({
        walletGroups: [makeGroup('mnemonic', stored)],
        from: stored.toLowerCase(),
        ecosystem: 'evm',
      })
    ).toBe(true);
    expect(
      canSignIntent({
        walletGroups: [makeGroup('Ledger', stored.toLowerCase())],
        from: stored,
        ecosystem: 'evm',
      })
    ).toBe(true);
  });

  test('an address held by no group, or no groups at all, cannot sign', () => {
    expect(
      canSignIntent({
        walletGroups: [
          makeGroup('mnemonic', '0x1111111111111111111111111111111111111111'),
        ],
        from: ADDRESS.evm,
        ecosystem: 'evm',
      })
    ).toBe(false);
    expect(
      canSignIntent({ walletGroups: null, from: ADDRESS.evm, ecosystem: 'evm' })
    ).toBe(false);
  });

  test('an address both watched and imported with a key can sign', () => {
    expect(
      canSignIntent({
        walletGroups: [
          makeGroup('readonly', ADDRESS.evm, 'watch'),
          makeGroup('private key', ADDRESS.evm, 'key'),
        ],
        from: ADDRESS.evm,
        ecosystem: 'evm',
      })
    ).toBe(true);
  });
});
