import { ethers } from 'ethers';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';

/**
 * Dev-only fixtures for the local transactions store. They reproduce profiles
 * that have sent hundreds of transactions from the extension (WLT-2647)
 * without actually sending any.
 *
 * Seeded items are mined (they carry a receipt), so the poller ignores them,
 * and their hashes are random, so the backend never "knows" them and the purge
 * check leaves them alone. They share nonce 0 to stay out of nonce
 * calculations for wallets that already have history on these chains.
 * They are removed by `initiator`.
 */
export const DEV_SEED_INITIATOR = 'dev-menu:seed-local-transactions';

const RECEIVER = '0x000000000000000000000000000000000000dEaD';
const SPENDER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'; // Uniswap Universal Router

const CHAINS: { chainId: number; tokens: string[] }[] = [
  {
    chainId: 1,
    tokens: [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
    ],
  },
  {
    chainId: 8453,
    tokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'], // USDC
  },
  {
    chainId: 42161,
    tokens: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'], // USDC
  },
  {
    chainId: 10,
    tokens: ['0x4200000000000000000000000000000000000042'], // OP
  },
];

const erc20 = new ethers.Interface([
  'function transfer(address to, uint256 amount)',
  'function approve(address spender, uint256 amount)',
]);

function randomHex(bytes: number) {
  return ethers.hexlify(ethers.randomBytes(bytes));
}

function createSeedTransaction({
  address,
  index,
  timestamp,
}: {
  address: string;
  index: number;
  timestamp: number;
}): TransactionObject {
  const { chainId, tokens } = CHAINS[index % CHAINS.length];
  // Every 10th item points at a random contract to exercise asset misses
  const token =
    index % 10 === 9 ? randomHex(20) : tokens[index % tokens.length];
  const kind = index % 3; // 0: native send, 1: token transfer, 2: approve
  const amount = BigInt(1 + (index % 97)) * 10n ** 15n;
  const to = kind === 0 ? RECEIVER : token;
  const data =
    kind === 0
      ? '0x'
      : kind === 1
      ? erc20.encodeFunctionData('transfer', [RECEIVER, amount])
      : erc20.encodeFunctionData('approve', [SPENDER, amount]);
  const hash = randomHex(32);
  return {
    hash,
    timestamp,
    initiator: DEV_SEED_INITIATOR,
    transaction: {
      hash,
      from: address,
      to,
      nonce: 0,
      chainId,
      data,
      value: kind === 0 ? amount.toString() : '0',
      gasLimit: '100000',
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '1000000',
      type: 2,
    },
    receipt: {
      from: address,
      to,
      contractAddress: '0x',
      blockHash: randomHex(32),
      transactionHash: hash,
      blockNumber: 1,
      type: 2,
      status: 1,
    },
  };
}

/** Spreads transactions one minute apart, going back from now */
export function createSeedTransactions({
  address,
  count,
  now = Date.now(),
}: {
  address: string;
  count: number;
  now?: number;
}): TransactionObject[] {
  return Array.from({ length: count }, (_, index) =>
    createSeedTransaction({ address, index, timestamp: now - index * 60_000 })
  );
}
