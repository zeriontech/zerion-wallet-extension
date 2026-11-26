import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SendTransactionError,
} from '@solana/web3.js';
import { Wallet } from './Wallet';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { emitter } from 'src/background/events';
import { Networks } from 'src/modules/networks/Networks';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import * as rpcRequest from 'src/shared/custom-rpc/rpc-request';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { SolanaSigning } from 'src/modules/solana/signing';
import { uint8ArrayToBase64 } from 'src/modules/crypto';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { TransactionFailure } from 'src/shared/analytics/transactionFailure';

/**
 * Drives the real transaction methods of `Wallet` with wallet state and
 * network calls stubbed out.
 */

vi.mock('src/background/constants', () => import('src/background/constants.mock'));
vi.mock('src/modules/phishing-defence/phishing-defence-service', () => ({
  phishingDefenceService: { checkDapp: vi.fn(), blockOriginWithWarning: vi.fn() },
}));

/**
 * `store-unit` ships a CommonJS bundle that `require`s an ES-module copy of
 * `nanoevents`, which the test runner cannot parse. It is a plain observable
 * store with no wallet logic; this keeps its contract so `PersistentStore` and
 * `GlobalPreferences` behave normally.
 */
vi.mock('store-unit', () => {
  type Listener = (state: unknown, prevState: unknown) => void;
  class Store {
    state: unknown;
    private listeners: Listener[] = [];
    constructor(initialState: unknown) {
      this.state = initialState;
    }
    on(_event: string, listener: Listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter((item) => item !== listener);
      };
    }
    getState() {
      return this.state;
    }
    setState(next: unknown) {
      const resolved =
        typeof next === 'function' ? (next as (state: unknown) => unknown)(this.state) : next;
      if (resolved === this.state) {
        return;
      }
      const prevState = this.state;
      this.state = resolved;
      for (const listener of this.listeners) {
        listener(this.state, prevState);
      }
    }
    setStateSilent(next: unknown) {
      this.state = next;
    }
  }
  class FormDataStore extends Store {}
  return { Store, FormDataStore };
});

vi.mock('webextension-polyfill', () => {
  const storage = new Map<string, unknown>();
  const local = {
    get: async (key: string) => ({ [key]: storage.get(key) }),
    set: async (entries: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(entries)) {
        storage.set(key, value);
      }
    },
    remove: async (key: string) => {
      storage.delete(key);
    },
    clear: async () => {
      storage.clear();
    },
  };
  const listener = { addListener: () => {}, removeListener: () => {} };
  const browser = {
    runtime: {
      getURL: (path: string) => `chrome-extension://test-extension/${path}`,
      getManifest: () => ({ action: { default_popup: 'popup.html' } }),
      sendMessage: async () => undefined,
      onMessage: listener,
    },
    storage: { local, session: local, onChanged: listener },
    tabs: { query: async () => [], sendMessage: async () => undefined },
    windows: {
      onRemoved: listener,
      get: async () => ({ id: 1, tabs: [] }),
      getCurrent: async () => ({ top: 0, left: 0, width: 1200 }),
      create: async () => ({ id: 1 }),
      update: async () => ({ id: 1 }),
      remove: async () => undefined,
    },
    alarms: { create: () => undefined, onAlarm: listener },
  };
  return { default: browser };
});

vi.mock('src/modules/networks/networks-store.background', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Keep both transaction paths off the live network store.
    getNetworksStore: () => ({
      fetchNetworkById: async () => ({ id: 'solana' }),
      loadNetworksByChainId: async () => ({
        getNetworkById: () => ({ id: 'ethereum' }),
      }),
    }),
  };
});

const SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112';

function createSignedTransaction(): StringBase64 {
  const feePayer = Keypair.generate();
  const transaction = new Transaction({
    feePayer: feePayer.publicKey,
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
  });
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: SystemProgram.programId,
      data: Buffer.alloc(0),
    }),
  );
  transaction.sign(feePayer);
  return uint8ArrayToBase64(transaction.serialize()) as StringBase64;
}

function createTxContext(
  overrides: Partial<TransactionContextParams> = {},
): TransactionContextParams {
  return {
    chain: 'solana',
    feeValueCommon: null,
    initiator: INTERNAL_ORIGIN,
    clientScope: 'External Dapp',
    addressAction: null,
    ...overrides,
  } as TransactionContextParams;
}

type Emitted = {
  failure?: TransactionFailure;
  context?: unknown;
};

type WalletInternals = {
  ensureRecord: (record: unknown) => void;
  getKeypairByAddress: (address: string) => unknown;
  assertNetworkMode: (options: unknown) => Promise<unknown>;
  getSigner: () => Promise<{ sendTransaction: (transaction: unknown) => Promise<unknown> }>;
};

function createHarness() {
  const wallet = new Wallet('test-wallet', null, {
    open: vi.fn(async () => 'window-1'),
    emit: vi.fn(),
  } as never);
  const internals = wallet as unknown as WalletInternals;

  vi.spyOn(wallet, 'ensureCurrentAddress').mockImplementation(() => SOLANA_ADDRESS);
  vi.spyOn(wallet, 'readCurrentAddress').mockImplementation(() => SOLANA_ADDRESS);
  vi.spyOn(internals, 'ensureRecord').mockImplementation(() => {});
  vi.spyOn(internals, 'getKeypairByAddress').mockImplementation(() => Keypair.generate() as never);
  vi.spyOn(internals, 'assertNetworkMode').mockImplementation(async () => ({ mode: 'default' }));
  vi.spyOn(Networks, 'getNetworkRpcUrlInternal').mockImplementation(() => 'http://rpc.test');

  const failures: Emitted[] = [];
  const sent: unknown[] = [];
  emitter.on('transactionFailed', (failure: TransactionFailure, context: unknown) => {
    failures.push({ failure, context });
  });
  emitter.on('transactionSent', (result: unknown) => {
    sent.push(result);
  });

  return { wallet, failures, sent };
}

beforeEach(() => {
  emitter.events = {};
  vi.spyOn(Connection.prototype, 'sendRawTransaction').mockResolvedValue('signature');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Solana broadcast failures', () => {
  test('a rejected node broadcast emits one broadcast failure and rethrows the same error', async () => {
    const { wallet, failures, sent } = createHarness();
    const txContext = createTxContext();
    const nodeError = new SendTransactionError({
      action: 'send',
      signature: 'signature',
      transactionMessage: 'Transaction simulation failed: Blockhash not found',
      logs: [],
    });
    vi.mocked(Connection.prototype.sendRawTransaction).mockRejectedValue(nodeError);

    const promise = wallet.solana_sendTransaction({
      params: { signed: createSignedTransaction(), publicKey: SOLANA_ADDRESS, params: txContext },
      context: { origin: INTERNAL_ORIGIN },
    });

    await expect(promise).rejects.toBe(nodeError);
    expect(failures).toHaveLength(1);
    expect(failures[0].failure).toEqual({
      message: nodeError.message,
      code: 'web3.send_failed',
      stage: 'broadcast',
      nodeMessage: 'Transaction simulation failed: Blockhash not found',
      address: SOLANA_ADDRESS,
    });
    expect(failures[0].context).toEqual({ mode: 'default', ...txContext });
    expect(sent).toHaveLength(0);
  });

  test('an accepted node broadcast emits only transactionSent', async () => {
    const { wallet, failures, sent } = createHarness();

    const result = await wallet.solana_sendTransaction({
      params: {
        signed: createSignedTransaction(),
        publicKey: SOLANA_ADDRESS,
        params: createTxContext(),
      },
      context: { origin: INTERNAL_ORIGIN },
    });

    expect(result.signature).toBe('signature');
    expect(sent).toHaveLength(1);
    expect(failures).toHaveLength(0);
  });
});

describe('Solana signing failures', () => {
  test('signAndSend with a signing error emits one sign failure and never broadcasts', async () => {
    const { wallet, failures } = createHarness();
    const signingError = new Error('User rejected the request.');
    vi.spyOn(SolanaSigning, 'signTransaction').mockImplementation(() => {
      throw signingError;
    });

    const promise = wallet.solana_signAndSendTransaction({
      params: { transaction: createSignedTransaction(), params: createTxContext() },
      context: { origin: INTERNAL_ORIGIN },
    });

    await expect(promise).rejects.toBe(signingError);
    expect(failures).toHaveLength(1);
    expect(failures[0].failure).toEqual(
      expect.objectContaining({
        code: 'sign.user_rejected',
        stage: 'sign',
        address: SOLANA_ADDRESS,
      }),
    );
    expect(vi.mocked(Connection.prototype.sendRawTransaction)).not.toHaveBeenCalled();
  });

  test('signAndSend with a rejected broadcast emits one broadcast failure', async () => {
    const { wallet, failures, sent } = createHarness();
    const signed = createSignedTransaction();
    vi.spyOn(SolanaSigning, 'signTransaction').mockImplementation(() => ({
      signature: 'signature',
      publicKey: SOLANA_ADDRESS,
      tx: signed,
    }));
    vi.mocked(Connection.prototype.sendRawTransaction).mockRejectedValue(
      new Error('blockhash not found'),
    );

    const promise = wallet.solana_signAndSendTransaction({
      params: { transaction: signed, params: createTxContext() },
      context: { origin: INTERNAL_ORIGIN },
    });

    await expect(promise).rejects.toThrow('blockhash not found');
    expect(failures).toHaveLength(1);
    expect(failures[0].failure).toEqual(
      expect.objectContaining({ code: 'broadcast.failed', stage: 'broadcast' }),
    );
    expect(sent).toHaveLength(0);
  });

  test('signTransaction with a signing error emits one sign failure', async () => {
    const { wallet, failures } = createHarness();
    vi.spyOn(SolanaSigning, 'signTransaction').mockImplementation(() => {
      throw new Error('Could not resolve signature');
    });

    const promise = wallet.solana_signTransaction({
      params: { transaction: createSignedTransaction(), params: createTxContext() },
      context: { origin: INTERNAL_ORIGIN },
    });

    await expect(promise).rejects.toThrow('Could not resolve signature');
    expect(failures).toHaveLength(1);
    expect(failures[0].failure).toEqual(
      expect.objectContaining({ code: 'sign.failed', stage: 'sign' }),
    );
  });

  test('signAllTransactions emits one failure with a null addressAction for a batch', async () => {
    const { wallet, failures } = createHarness();
    vi.spyOn(SolanaSigning, 'signAllTransactions').mockImplementation(() => {
      throw new Error('wallet is locked');
    });
    const txContext = createTxContext({
      addressAction: { type: { displayValue: 'Send' } } as never,
    });

    const promise = wallet.solana_signAllTransactions({
      params: {
        transactions: [createSignedTransaction(), createSignedTransaction()],
        params: txContext,
      },
      context: { origin: INTERNAL_ORIGIN },
    });

    await expect(promise).rejects.toThrow('wallet is locked');
    expect(failures).toHaveLength(1);
    expect(failures[0].failure).toEqual(
      expect.objectContaining({ code: 'sign.failed', stage: 'sign' }),
    );
    expect(failures[0].context).toEqual({
      mode: 'default',
      ...txContext,
      addressAction: null,
    });
  });
});

describe('EVM dapp signing fees', () => {
  test.each([
    {
      feeType: 'missing',
      suppliedFees: {},
      fallbackFee: '0x3b9aca00',
    },
    {
      feeType: 'legacy',
      suppliedFees: { type: 0, gasPrice: '0x7' },
      fallbackFee: null,
    },
    {
      feeType: 'EIP-1559',
      suppliedFees: { type: 2, maxFeePerGas: '0x10', maxPriorityFeePerGas: '0x0' },
      fallbackFee: null,
    },
  ])('signs with $feeType fees without ZPI', async ({ suppliedFees, fallbackFee }) => {
    const wallet = new Wallet('test-wallet', null, {} as never);
    const internals = wallet as unknown as WalletInternals;
    const from = '0x0000000000000000000000000000000000000001';
    const to = '0x0000000000000000000000000000000000000002';
    const txHash = `0x${'a'.repeat(64)}`;
    const sendTransaction = vi.fn(async () => ({
      hash: txHash,
      chainId: 1n,
      gasLimit: 23_100n,
      value: 0n,
    }));
    vi.spyOn(wallet, 'ensureCurrentAddress').mockReturnValue(from);
    vi.spyOn(wallet, 'getChainIdForOrigin').mockResolvedValue('0x1' as ChainId);
    vi.spyOn(internals, 'assertNetworkMode').mockResolvedValue({ mode: 'default' });
    vi.spyOn(internals, 'getSigner').mockResolvedValue({ sendTransaction });
    vi.spyOn(Networks, 'getNetworkRpcUrlInternal').mockReturnValue('https://rpc.test');
    const zpiGas = vi
      .spyOn(ZerionAPI, 'getGasPrices')
      .mockRejectedValue(new Error('Unexpected ZPI'));
    const nodeRpc = vi
      .spyOn(rpcRequest, 'sendRpcRequest')
      .mockImplementation(async (_url, request) => {
        switch (request.method) {
          case 'eth_estimateGas':
            return { jsonrpc: '2.0', id: 1, result: '0x5208' };
          case 'eth_gasPrice':
            return { jsonrpc: '2.0', id: 2, result: '0x3b9aca00' };
          default:
            throw new Error(`Unexpected RPC method: ${request.method}`);
        }
      });

    const transaction = { from, to, chainId: 1, nonce: 0, ...suppliedFees };
    const result = await wallet.signAndSendTransaction({
      params: [transaction, createTxContext({ chain: 'ethereum', initiator: 'https://dapp.test' })],
      context: { origin: INTERNAL_ORIGIN },
    });

    expect(result.hash).toBe(txHash);
    expect(sendTransaction).toHaveBeenCalledExactlyOnceWith({
      type: undefined,
      ...transaction,
      gasLimit: 23_100,
      ...(fallbackFee ? { gasPrice: fallbackFee } : {}),
    });
    expect(zpiGas).not.toHaveBeenCalled();
    expect(nodeRpc.mock.calls.map(([url, { method }]) => [url, method])).toEqual(
      (fallbackFee ? ['eth_estimateGas', 'eth_gasPrice'] : ['eth_estimateGas']).map((method) => [
        'https://rpc.test',
        method,
      ]),
    );
  });
});
