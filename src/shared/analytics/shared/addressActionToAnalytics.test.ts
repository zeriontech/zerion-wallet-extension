import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { addressActionToAnalytics } from './addressActionToAnalytics';

/**
 * Builds a minimal address action with a single act on `chain` containing the
 * given transfers. Only the fields read by addressActionToAnalytics are typed
 * out; the rest is cast to keep the fixture small.
 */
function makeAction({
  chain,
  type = 'Trade',
  transfers,
}: {
  chain: string;
  type?: string;
  transfers: Array<{
    direction: 'in' | 'out';
    fungibleId: string;
    name: string;
    implementations: Record<
      string,
      { address: string | null; decimals: number }
    >;
    quantity?: string;
    usdValue?: number;
  }>;
}): AnyAddressAction {
  return {
    type: { value: type, displayValue: type },
    acts: [
      {
        type: { value: type, displayValue: type },
        transaction: { chain: { id: chain, name: chain, iconUrl: '' } },
        content: {
          transfers: transfers.map((t) => ({
            direction: t.direction,
            amount: {
              quantity: t.quantity ?? '1',
              usdValue: t.usdValue ?? null,
            },
            fungible: {
              id: t.fungibleId,
              name: t.name,
              symbol: t.name,
              implementations: t.implementations,
              iconUrl: null,
              verified: true,
              new: false,
              meta: {},
            },
            nft: null,
          })),
        },
      },
    ],
  } as unknown as AnyAddressAction;
}

describe('addressActionToAnalytics', () => {
  test('asset_address uses the contract address, not the fungibleId (WLT-1357)', () => {
    const action = makeAction({
      chain: 'ethereum',
      transfers: [
        {
          direction: 'out',
          // fungibleId is a UUID — must NOT leak into asset_address
          fungibleId: '41c0a219-0c47-4b25-9789-d1959f8c72e3',
          name: 'Token',
          implementations: {
            ethereum: {
              address: '0xcd0611177e2c46b5c83778d3404a23acffb8422d',
              decimals: 18,
            },
          },
        },
      ],
    });

    const result = addressActionToAnalytics({
      addressAction: action,
      outputChain: null,
    });

    expect(result.asset_address_sent).toEqual([
      '0xcd0611177e2c46b5c83778d3404a23acffb8422d',
    ]);
  });

  test('prefers the implementation on the action chain', () => {
    const action = makeAction({
      chain: 'polygon',
      transfers: [
        {
          direction: 'out',
          fungibleId: 'some-uuid',
          name: 'Token',
          implementations: {
            ethereum: { address: '0xETHADDR', decimals: 18 },
            polygon: { address: '0xPOLYADDR', decimals: 18 },
          },
        },
      ],
    });

    const result = addressActionToAnalytics({
      addressAction: action,
      outputChain: null,
    });

    expect(result.asset_address_sent).toEqual(['0xPOLYADDR']);
  });

  test('falls back to any implementation address when the chain has none', () => {
    const action = makeAction({
      chain: 'arbitrum',
      transfers: [
        {
          direction: 'out',
          fungibleId: 'some-uuid',
          name: 'Token',
          implementations: {
            ethereum: { address: '0xETHADDR', decimals: 18 },
          },
        },
      ],
    });

    const result = addressActionToAnalytics({
      addressAction: action,
      outputChain: null,
    });

    expect(result.asset_address_sent).toEqual(['0xETHADDR']);
  });

  test('native asset with no contract address yields no address (not a UUID)', () => {
    const action = makeAction({
      chain: 'ethereum',
      transfers: [
        {
          direction: 'out',
          fungibleId: 'eth',
          name: 'Ethereum',
          implementations: {
            ethereum: { address: null, decimals: 18 },
          },
        },
      ],
    });

    const result = addressActionToAnalytics({
      addressAction: action,
      outputChain: null,
    });

    // toMaybeArr filters out the null address → empty array, never a UUID
    expect(result.asset_address_sent).toEqual([]);
  });

  test('cross-chain received asset resolves against the output chain', () => {
    const action = makeAction({
      chain: 'ethereum', // act/source chain
      type: 'Bridge',
      transfers: [
        {
          direction: 'out',
          fungibleId: 'in-uuid',
          name: 'TokenA',
          implementations: { ethereum: { address: '0xSRC', decimals: 18 } },
        },
        {
          direction: 'in',
          fungibleId: 'out-uuid',
          name: 'TokenB',
          implementations: {
            ethereum: { address: '0xWRONG', decimals: 18 },
            optimism: { address: '0xDEST', decimals: 18 },
          },
        },
      ],
    });

    const result = addressActionToAnalytics({
      addressAction: action,
      outputChain: 'optimism',
    });

    expect(result.asset_address_sent).toEqual(['0xSRC']);
    expect(result.asset_address_received).toEqual(['0xDEST']);
  });
});
