import type {
  PendingAction,
  PendingActionWire,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingList } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import type { TransactionEVM } from 'src/shared/types/Quote';
import {
  fakeSolTransaction,
  USER,
} from 'src/modules/solana/fakeSolTransactions.fixtures';
import type { BuildActionResult } from './signPendingAction';

export const NOW_SECONDS = 1791295200;
export const NOW_MS = NOW_SECONDS * 1000;

export const EVM_ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
export const SOLANA_ADDRESS = USER.toBase58();

const BASE = {
  id: 'base',
  name: 'Base',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/base.png',
};

const SOLANA = {
  id: 'solana',
  name: 'Solana',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/solana.png',
};

function unsignedRow({
  id,
  address,
  chain,
  type,
  availableAtSeconds,
  status = 'unsigned',
  hash = '',
}: {
  id: string;
  address: string;
  chain: typeof BASE;
  type: PendingActionWire['type'];
  availableAtSeconds: number | null;
  status?: 'unsigned' | 'pending';
  hash?: string;
}): PendingAction {
  const wire: PendingActionWire = {
    address,
    id,
    timestamp: NOW_SECONDS - 600,
    status: null,
    type,
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    content: {
      transfers: [
        {
          direction: 'out',
          amount: {
            currency: 'usd',
            quantity: '12.5',
            value: 12.5,
            usdValue: 12.5,
          },
          fungible: null,
          nft: null,
        },
      ],
      approvals: null,
    },
    acts: [
      {
        type,
        label: null,
        content: null,
        rate: null,
        status: '',
        transaction: { chain, hash, explorerUrl: null },
      },
    ],
    availableAt: availableAtSeconds,
  };
  const [row] = normalizePendingList([wire], status);
  return row;
}

/** A Zama unshield finalisation on Base: a typed row that must never be reported as "Trade" */
export function evmReadyRow(overrides: { id?: string } = {}) {
  return unsignedRow({
    id: overrides.id ?? '6f1d3a9c2b7e4d8f0a5c1e3b7d9f2a4c',
    address: EVM_ADDRESS,
    chain: BASE,
    type: { value: 'withdraw', displayValue: 'Withdraw' },
    availableAtSeconds: NOW_SECONDS - 60,
  });
}

export function solanaReadyRow() {
  return unsignedRow({
    id: '9a8b7c6d5e4f30211203f4e5d6c7b8a9',
    address: SOLANA_ADDRESS,
    chain: SOLANA,
    type: { value: 'receive', displayValue: 'Receive' },
    availableAtSeconds: NOW_SECONDS - 60,
  });
}

export function evmNotReadyRow() {
  return unsignedRow({
    id: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    address: EVM_ADDRESS,
    chain: BASE,
    type: { value: 'withdraw', displayValue: 'Withdraw' },
    availableAtSeconds: NOW_SECONDS + 3600,
  });
}

export function evmPendingRow(id: string, hash: string) {
  return unsignedRow({
    id,
    address: EVM_ADDRESS,
    chain: BASE,
    type: { value: 'withdraw', displayValue: 'Withdraw' },
    availableAtSeconds: null,
    status: 'pending',
    hash,
  });
}

export const EVM_BUILT_TRANSACTION: TransactionEVM = {
  type: '0x2',
  from: EVM_ADDRESS,
  to: '0x0e4ff5b2c1a5c8a8a2f1c6c4c3b4a1c5d2e3f4a5',
  nonce: '0x1b',
  chainId: '0x2105',
  gas: '0x3d090',
  gasPrice: null,
  maxFee: '0x5f5e100',
  maxPriorityFee: '0xf4240',
  value: '0x0',
  data: '0xa9059cbb000000000000000000000000',
  customData: null,
};

export function evmBuildResult(): BuildActionResult {
  return {
    quoteId: 'q-evm-5b1f0c2e',
    transaction: { evm: EVM_BUILT_TRANSACTION, solana: null },
    intent: null,
  };
}

export const SOLANA_BUILT_TRANSACTION = fakeSolTransaction('v0', {
  payer: USER,
  owner: USER,
}).transaction;

export function solanaBuildResult(): BuildActionResult {
  return {
    quoteId: 'q-sol-77c2a9d1',
    transaction: { evm: null, solana: SOLANA_BUILT_TRANSACTION },
    intent: null,
  };
}
