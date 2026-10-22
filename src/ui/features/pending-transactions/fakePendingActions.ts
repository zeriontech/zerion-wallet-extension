import type {
  ActionChain,
  PendingActionWire,
} from 'src/modules/zerion-api/requests/wallet-get-actions';

const MINUTE_S = 60;
const DAY_S = 86400;

const EVM_HASH = `0x${'5e7a'.repeat(16)}`;

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

function fakeRow({
  n,
  address,
  timestamp,
  type,
  chain = BASE,
  hash = '',
  status = null,
  availableAt,
}: {
  n: number;
  address: string;
  timestamp: number;
  type: PendingActionWire['type'];
  chain?: ActionChain;
  hash?: string;
  status?: string | null;
  availableAt?: number;
}): PendingActionWire {
  return {
    address,
    id: `fake-${n}`,
    timestamp,
    status,
    type,
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    content: { transfers: null, approvals: null },
    acts: [
      {
        type,
        label: null,
        content: { transfers: null, approvals: null },
        rate: null,
        status: '',
        transaction: { chain, hash, explorerUrl: null },
      },
    ],
    ...(availableAt === undefined ? {} : { availableAt }),
  };
}

/** The EVM rows of web's dev-menu `createFakePendingLists` (WLT-2731), one per display case, without their transfer content. */
export function createFakePendingLists(
  address: string,
  nowMs: number
): { pending: PendingActionWire[]; unsigned: PendingActionWire[] } {
  const nowS = Math.floor(nowMs / 1000);
  const receive = { value: 'receive', displayValue: 'Receive' } as const;
  const trade = { value: 'trade', displayValue: 'Trade' } as const;
  const send = { value: 'send', displayValue: 'Send' } as const;
  const row = (
    n: number,
    type: PendingActionWire['type'],
    rest: Partial<Parameters<typeof fakeRow>[0]> = {}
  ) => fakeRow({ n, address, timestamp: nowS - n * MINUTE_S, type, ...rest });
  return {
    pending: [
      row(1, receive),
      row(2, trade),
      row(3, send, { hash: EVM_HASH }),
      row(7, trade, { status: 'confirmed' }),
    ],
    unsigned: [
      row(4, send, { availableAt: nowS + 7200 }),
      row(5, receive, { chain: ARBITRUM, timestamp: nowS - 30 * DAY_S }),
      row(6, trade, { availableAt: nowS - MINUTE_S }),
    ],
  };
}
