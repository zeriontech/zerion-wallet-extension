import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { ReceiveFungibles } from 'src/modules/zerion-api/requests/asset-get-receive-fungibles';
import {
  makePosition,
  WEB_BACKEND_SUPPORTED,
} from 'src/ui/features/confidential-balances/confidentialUnderlying.fixtures';
import { deriveDefaultOutput } from './deriveDefaultOutput';

// Production asset-storage ids: confidential tokens carry UUIDs, USDC its address.
const CUSDC_ID = 'c8bb33a4-9f3c-48f6-bd76-97e3f4649670';
const USDC_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDT_ID = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const WETH_ID = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const WBTC_ID = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const DAI_ID = 'dai';
const CWBTC_ID = '077154e9-c079-457c-8709-fe6023a048a2';
const CUSDT_ID = '9e42810e-4fbd-4fb3-9854-d45a8352ce3f';
const NO_ETHEREUM_IMPL_ID = 'no-ethereum-implementation';

const positions = [
  makePosition({
    fungibleId: CUSDC_ID,
    address: '0xe978f22157048e5db8e5d07971376e86671672b2',
  }),
  makePosition({ fungibleId: USDT_ID, address: USDT_ID }),
  makePosition({
    fungibleId: CWBTC_ID,
    address: '0xd86ae89c089b380f064fe01899b4071f1eb6bb3d',
  }),
  makePosition({
    fungibleId: CUSDT_ID,
    address: '0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50',
  }),
  makePosition({
    chainId: 'base',
    fungibleId: NO_ETHEREUM_IMPL_ID,
    address: '0xe978f22157048e5db8e5d07971376e86671672b2',
  }),
];

function popular(ids: string[]): ReceiveFungibles {
  return {
    popular: ids.map((id) => ({ id } as unknown as Fungible)),
    others: [],
  };
}

const receiveFungibles = popular([WETH_ID, USDC_ID, USDT_ID]);

function derive({
  inputFungibleId,
  outputChainId,
  outputFungibleId,
  receive = receiveFungibles,
  positionList = positions,
}: {
  inputFungibleId: string;
  outputChainId?: string;
  outputFungibleId?: string;
  receive?: ReceiveFungibles;
  positionList?: typeof positions;
}) {
  return deriveDefaultOutput({
    inputSupportsTrading: true,
    inputChain: 'ethereum',
    inputFungibleId,
    outputChainId,
    outputFungibleId,
    defaultOutputChain: 'ethereum',
    outputBaseAssetId: 'eth',
    receiveFungibles: receive,
    positions: positionList,
  });
}

function receive(params: Parameters<typeof derive>[0]) {
  const output = derive(params);
  return {
    outputChain: params.outputChainId ?? output.outputChain,
    outputFungibleId: params.outputFungibleId ?? output.outputFungibleId,
  };
}

describe('Pay is a Zama confidential token → Receive defaults to its underlying', () => {
  test('Receive unset: selecting cUSDC as Pay makes Receive USDC instead of the Popular pick', () => {
    expect(receive({ inputFungibleId: CUSDC_ID })).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: USDC_ID,
    });
  });

  test('Receive chosen by the user: selecting cUSDC as Pay keeps Receive', () => {
    expect(
      receive({
        inputFungibleId: CUSDC_ID,
        outputChainId: 'ethereum',
        outputFungibleId: DAI_ID,
      })
    ).toEqual({ outputChain: 'ethereum', outputFungibleId: DAI_ID });
  });

  test('USDC already as Receive: selecting cUSDC is a no-op for Receive', () => {
    expect(
      receive({
        inputFungibleId: CUSDC_ID,
        outputChainId: 'ethereum',
        outputFungibleId: USDC_ID,
      })
    ).toEqual({ outputChain: 'ethereum', outputFungibleId: USDC_ID });
  });

  test('a Receive chain on another network without a token keeps the Popular pick', () => {
    expect(
      derive({ inputFungibleId: CUSDC_ID, outputChainId: 'base' })
        .outputFungibleId
    ).toBe(WETH_ID);
  });

  test('unmapped Pay token: Receive is the Popular pick as before', () => {
    expect(receive({ inputFungibleId: USDT_ID })).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: WETH_ID,
    });
  });

  test('registry-only wrapper: selecting cWBTC as Pay makes Receive WBTC', () => {
    expect(receive({ inputFungibleId: CWBTC_ID })).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: WBTC_ID,
    });
  });

  test('checksummed wrapper address: selecting cUSDT as Pay makes Receive USDT', () => {
    expect(receive({ inputFungibleId: CUSDT_ID })).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: USDT_ID,
    });
  });

  test('position without an Ethereum implementation: Receive is the Popular pick', () => {
    expect(receive({ inputFungibleId: NO_ETHEREUM_IMPL_ID })).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: WETH_ID,
    });
  });

  test('Pay cUSDC defaults Receive to USDC before Popular loads', () => {
    const output = deriveDefaultOutput({
      inputSupportsTrading: true,
      inputChain: 'ethereum',
      inputFungibleId: CUSDC_ID,
      defaultOutputChain: 'ethereum',
      outputBaseAssetId: 'eth',
      receiveFungibles: undefined,
      positions,
    });
    expect(output).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: USDC_ID,
      outputDefaultPending: false,
    });
  });

  test('a wrapper Pay on Ethereum puts Receive on Ethereum even when the default output chain differs', () => {
    expect(
      deriveDefaultOutput({
        inputSupportsTrading: true,
        inputChain: 'ethereum',
        inputFungibleId: CUSDC_ID,
        defaultOutputChain: 'base',
        outputBaseAssetId: 'eth',
        receiveFungibles,
        positions,
      })
    ).toEqual({
      outputChain: 'ethereum',
      outputFungibleId: USDC_ID,
      outputDefaultPending: false,
    });
  });
});

describe.each(WEB_BACKEND_SUPPORTED)(
  'backend-supported wrapper %s',
  (wrapperAddress, underlyingId) => {
    const wrapperId = `wrapper-${wrapperAddress}`;
    const positionList = [
      makePosition({ fungibleId: wrapperId, address: wrapperAddress }),
      makePosition({ fungibleId: underlyingId, address: underlyingId }),
    ];
    const receiveList = popular([DAI_ID, WETH_ID]);

    test('Receive unset defaults to the underlying on the same chain', () => {
      expect(
        derive({
          inputFungibleId: wrapperId,
          receive: receiveList,
          positionList,
        })
      ).toEqual({
        outputChain: 'ethereum',
        outputFungibleId: underlyingId,
        outputDefaultPending: false,
      });
    });

    test('a user-chosen Receive is never replaced', () => {
      expect(
        receive({
          inputFungibleId: wrapperId,
          outputChainId: 'ethereum',
          outputFungibleId: WBTC_ID,
          receive: receiveList,
          positionList,
        })
      ).toEqual({ outputChain: 'ethereum', outputFungibleId: WBTC_ID });
    });

    test('its non-wrapper underlying as Pay keeps the Popular pick', () => {
      expect(
        derive({
          inputFungibleId: underlyingId,
          receive: receiveList,
          positionList,
        }).outputFungibleId
      ).toBe(DAI_ID);
    });
  }
);
