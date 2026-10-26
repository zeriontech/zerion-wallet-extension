import type {
  OrderActionState,
  OrderActionWire,
} from 'src/modules/zerion-api/requests/transaction-get-order-status';
import type {
  ActionChain,
  ActionType,
  Transfer,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';

export const OWNER = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
export const CREATED_AT_S = 1_760_529_600;

const ETHEREUM: ActionChain = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
};
const BASE: ActionChain = {
  id: 'base',
  name: 'Base',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/base.png',
};
const ARBITRUM: ActionChain = {
  id: 'arbitrum',
  name: 'Arbitrum',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/arbitrum.png',
};

const USDC = {
  id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  name: 'USD Coin',
  symbol: 'USDC',
  iconUrl:
    'https://token-icons.s3.amazonaws.com/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
} as Fungible;
const CUSDC = {
  id: '0xe978f22157048e5db8e5d07971376e86671672b2',
  name: 'Confidential USD Coin',
  symbol: 'cUSDC',
  iconUrl:
    'https://token-icons.s3.amazonaws.com/0xe978f22157048e5db8e5d07971376e86671672b2.png',
} as Fungible;

function orderAction({
  id,
  state,
  type,
  chain,
  hash,
  transfers,
  availableAt,
}: {
  id: string;
  state: OrderActionState;
  type: { value: ActionType; displayValue: string };
  chain: ActionChain;
  hash: string | null;
  transfers: Transfer[];
  availableAt?: number;
}): OrderActionWire {
  const content = { transfers, approvals: null };
  return {
    address: OWNER,
    id,
    timestamp: CREATED_AT_S,
    type,
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    content,
    acts: [
      {
        type,
        label: null,
        content,
        rate: null,
        transaction: hash
          ? {
              chain,
              hash,
              explorerUrl: `https://etherscan.io/tx/${hash}`,
            }
          : null,
      },
    ],
    ...(availableAt === undefined ? {} : { availableAt }),
    state,
  };
}

function usdc(
  fungible: Fungible,
  direction: 'in' | 'out',
  quantity: string
): Transfer {
  return {
    direction,
    amount: {
      currency: 'usd',
      quantity,
      value: Number(quantity),
      usdValue: Number(quantity),
    },
    fungible,
    nft: null,
  };
}

/** A Zama unshield's first step: the unwrap request, mined */
export const ZAMA_UNWRAP_MINED = orderAction({
  id: 'zama:0x7c41e0b2:unwrap',
  state: 'mined',
  type: { value: 'withdraw', displayValue: 'Withdraw' },
  chain: ETHEREUM,
  hash: `0x${'7c41e0b2'.repeat(8)}`,
  transfers: [usdc(CUSDC, 'out', '250')],
});

/** The unshield's Claim (`finalizeUnwrap`), awaiting the user's signature; `availableAt` is set per test */
export function zamaClaimUnsigned(availableAt?: number) {
  return orderAction({
    id: 'zama:0x7c41e0b2:finalize',
    state: 'unsigned',
    type: { value: 'claim', displayValue: 'Claim' },
    chain: ETHEREUM,
    hash: null,
    transfers: [usdc(USDC, 'in', '250')],
    availableAt,
  });
}

/** A Relay bridge's source leg on Base, mined */
export const BRIDGE_SOURCE_MINED = orderAction({
  id: 'relay:0x3e9a51d0:source',
  state: 'mined',
  type: { value: 'send', displayValue: 'Send' },
  chain: BASE,
  hash: `0x${'3e9a51d0'.repeat(8)}`,
  transfers: [usdc(USDC, 'out', '100')],
});

/** The same bridge's destination fill on Arbitrum, still confirming */
export const BRIDGE_DESTINATION_PENDING = orderAction({
  id: 'relay:0x3e9a51d0:destination',
  state: 'pending',
  type: { value: 'receive', displayValue: 'Receive' },
  chain: ARBITRUM,
  hash: `0x${'b2d4f6a8'.repeat(8)}`,
  transfers: [usdc(USDC, 'in', '99.82')],
});

/** The same destination fill, confirmed */
export const BRIDGE_DESTINATION_MINED: OrderActionWire = {
  ...BRIDGE_DESTINATION_PENDING,
  state: 'mined',
};
