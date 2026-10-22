import { hashQueryKey } from '@tanstack/react-query';
import { Networks } from 'src/modules/networks/Networks';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { createChain } from 'src/modules/networks/Chain';
import {
  getInterpretQueryKey,
  isInterpretationLoading,
  isInterpretQueryEnabled,
} from './interpretQuery';

function network(id: string, chainId: number): NetworkInfo {
  return {
    id,
    name: id,
    iconUrl: null,
    testnet: false,
    specification: { eip155: { chainId } },
    explorer: null,
    baseAsset: {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      iconUrl: null,
      implementations: { [id]: { address: null, decimals: 18 } },
    },
    flags: {
      supportsTrading: true,
      supportsSending: true,
      supportsBridging: true,
      supportsActions: true,
      supportsPositions: true,
      supportsNftPositions: true,
      supportsSponsoredTransactions: false,
      supportsGasPrices: true,
      supportsSimulations: true,
    },
    rpcUrl: `https://rpc.zerion.io/v1/${id}`,
    publicRpcUrl: `https://rpc.zerion.io/v1/${id}`,
  } as NetworkInfo;
}

type KeyInput = Parameters<typeof getInterpretQueryKey>[0];

const baseInput: KeyInput = {
  populatedTransaction: {
    chainId: '0x2105',
    from: '0x52Fb91492000F2a900a6b75B37D588AB37378e59',
    to: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    data: '0x3593564c',
    value: '0x0',
  },
  chainGasPrices: {
    fast: { eip1559: { maxFee: 100, priorityFee: 1 } },
  } as unknown as KeyInput['chainGasPrices'],
  configuration: {
    networkFee: { speed: 'fast', custom1559GasPrice: null },
    nonce: null,
    slippage: null,
  } as unknown as KeyInput['configuration'],
  allowanceQuantityBase: '',
  chain: createChain('base'),
  singleAddress: '0x52Fb91492000F2a900a6b75B37D588AB37378e59',
  transactionAction: {
    type: 'execute',
  } as unknown as KeyInput['transactionAction'],
  currency: 'usd',
  source: 'mainnet',
  eligible: undefined,
  eligibilityStatus: 'loading',
  origin: 'https://app.uniswap.org',
  walletAddress: '0x52Fb91492000F2a900a6b75B37D588AB37378e59',
};

describe('isInterpretQueryEnabled', () => {
  const combinations = [false, true].flatMap((supportsSimulations) =>
    [false, true].flatMap((isWaitingForGasPrices) =>
      [false, true].map((isPrepared) => ({
        supportsSimulations,
        isWaitingForGasPrices,
        isPrepared,
        expected:
          supportsSimulations === true &&
          isWaitingForGasPrices === false &&
          isPrepared === true,
      }))
    )
  );

  test('covers all 8 combinations with exactly one enabled', () => {
    expect(combinations).toHaveLength(8);
    expect(combinations.filter((c) => c.expected)).toHaveLength(1);
  });

  test.each(combinations)(
    'supportsSimulations=$supportsSimulations isWaitingForGasPrices=$isWaitingForGasPrices isPrepared=$isPrepared -> $expected',
    ({ expected, ...input }) => {
      expect(isInterpretQueryEnabled(input)).toBe(expected);
    }
  );
});

describe('isInterpretationLoading', () => {
  // [isInitialLoading, isError, supportsSimulations, hasInterpretation, expected]
  const cases: Array<[boolean, boolean, boolean, boolean, boolean]> = [
    [false, false, false, false, false],
    [false, false, false, true, false],
    [false, false, true, false, true],
    [false, false, true, true, false],
    [false, true, false, false, false],
    [false, true, false, true, false],
    [false, true, true, false, false],
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, true, true],
    [true, false, true, false, true],
    [true, false, true, true, true],
    [true, true, false, false, true],
    [true, true, false, true, true],
    [true, true, true, false, true],
    [true, true, true, true, true],
  ];

  test('covers all 16 input combinations', () => {
    const distinct = new Set(cases.map((c) => c.slice(0, 4).join()));
    expect(distinct.size).toBe(16);
  });

  test.each(cases)(
    'isInitialLoading=%s isError=%s supportsSimulations=%s hasInterpretation=%s -> %s',
    (
      isInitialLoading,
      isError,
      supportsSimulations,
      hasInterpretation,
      expected
    ) => {
      expect(
        isInterpretationLoading({
          isInitialLoading,
          isError,
          supportsSimulations,
          hasInterpretation,
        })
      ).toBe(expected);
    }
  );

  test('a disabled query with no interpretation on a simulation network reads as loading', () => {
    expect(
      isInterpretationLoading({
        isInitialLoading: false,
        isError: false,
        supportsSimulations: true,
        hasInterpretation: false,
      })
    ).toBe(true);
  });
});

describe('getInterpretQueryKey', () => {
  test('starts with the query name', () => {
    expect(getInterpretQueryKey(baseInput)[0]).toBe(
      'interpretTxBasedOnEligibility'
    );
  });

  test('is independent of which networks are loaded', () => {
    const fewNetworks = new Networks({
      networks: [network('base', 8453)],
      ethereumChainConfigs: [],
      visitedChains: [],
    });
    const moreNetworks = new Networks({
      networks: [
        network('base', 8453),
        network('ethereum', 1),
        network('arbitrum', 42161),
      ],
      ethereumChainConfigs: [],
      visitedChains: ['arbitrum'],
    });
    expect(hashQueryKey([fewNetworks])).not.toBe(hashQueryKey([moreNetworks]));

    const keyWithFew = getInterpretQueryKey({
      ...baseInput,
      networks: fewNetworks,
    } as KeyInput);
    const keyWithMore = getInterpretQueryKey({
      ...baseInput,
      networks: moreNetworks,
    } as KeyInput);

    expect(hashQueryKey(keyWithFew)).toBe(hashQueryKey(keyWithMore));
    expect(keyWithFew.every((part) => !(part instanceof Networks))).toBe(true);
    expect(keyWithMore.every((part) => !(part instanceof Networks))).toBe(true);
  });

  const changes: Array<[keyof KeyInput, Partial<KeyInput>]> = [
    [
      'populatedTransaction',
      {
        populatedTransaction: {
          ...baseInput.populatedTransaction,
          gasLimit: '0x30d40',
        },
      },
    ],
    [
      'chainGasPrices',
      {
        chainGasPrices: {
          fast: { eip1559: { maxFee: 200, priorityFee: 1 } },
        } as unknown as KeyInput['chainGasPrices'],
      },
    ],
    [
      'configuration',
      {
        configuration: {
          ...baseInput.configuration,
          nonce: '12',
        } as KeyInput['configuration'],
      },
    ],
    ['allowanceQuantityBase', { allowanceQuantityBase: '1000000' }],
    ['chain', { chain: createChain('ethereum') }],
    ['currency', { currency: 'eur' }],
    ['source', { source: 'testnet' }],
    ['eligible', { eligible: true }],
    ['eligibilityStatus', { eligibilityStatus: 'success' }],
    ['origin', { origin: 'https://app.1inch.io' }],
    [
      'walletAddress',
      { walletAddress: '0x0000000000000000000000000000000000000001' },
    ],
  ];

  test.each(changes)('changing %s changes the key hash', (_name, change) => {
    const baseHash = hashQueryKey(getInterpretQueryKey(baseInput));
    const changedHash = hashQueryKey(
      getInterpretQueryKey({ ...baseInput, ...change })
    );
    expect(changedHash).not.toBe(baseHash);
  });
});
