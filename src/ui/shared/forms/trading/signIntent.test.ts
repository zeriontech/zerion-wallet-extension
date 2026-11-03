import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { IntentMultichain } from 'src/shared/types/Quote';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import {
  SIGNATURE_LENGTH_IN_BYTES,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  JUPITER,
  USER,
  fakeSolTransaction,
} from 'src/modules/solana/fakeSolTransactions.fixtures';
import { ZEROX_GASLESS_TRADE } from './intentTypedData.fixtures';

const walletPortRequest =
  jest.fn<(method: string, params?: unknown) => Promise<unknown>>();
const hardwareRequest =
  jest.fn<(request: unknown, contentWindow: Window) => Promise<unknown>>();
const signSolanaTransaction = jest.fn<(params: unknown) => Promise<unknown>>();
const getLedgerIframeController = jest.fn();

jest.unstable_mockModule('src/ui/shared/channels', () => ({
  walletPort: { request: walletPortRequest },
}));
jest.unstable_mockModule(
  'src/ui/hardware-wallet/useLedgerIframeController',
  () => ({
    getLedgerIframeController,
  })
);
jest.unstable_mockModule(
  'src/ui/pages/HardwareWalletConnection/shared/messageHandler',
  () => ({ hardwareMessageHandler: { request: hardwareRequest } })
);
jest.unstable_mockModule(
  'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction/HardwareSignTransaction',
  () => ({ signSolanaTransaction })
);

const { signIntent, IntentSignerSlotError } = await import('./signIntent');
const { hardwareMessageHandler } = await import(
  'src/ui/pages/HardwareWalletConnection/shared/messageHandler'
);
const { ReadonlyWalletError } = await import(
  'src/ui/components/TransactionSigner/errors'
);

const CONTENT_WINDOW = { name: 'ledger-iframe' } as unknown as Window;
const DERIVATION_PATH = "m/44'/60'/0'/0/0";
const EVM_ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const EVM_SIGNATURE = `0x${'ab'.repeat(65)}`;

const SOLANA_FIXTURE = fakeSolTransaction('v0', {
  payer: JUPITER,
  owner: USER,
});
const INTENTS: Record<'evm' | 'solana', IntentMultichain> = {
  evm: { evm: ZEROX_GASLESS_TRADE, solana: null },
  solana: { evm: null, solana: SOLANA_FIXTURE.transaction },
};
const ADDRESSES = { evm: EVM_ADDRESS, solana: USER.toBase58() };

type WalletKind = 'software' | 'ledger' | 'readonly';

function walletOf(kind: WalletKind, ecosystem: 'evm' | 'solana') {
  const address = ADDRESSES[ecosystem];
  return (
    kind === 'ledger'
      ? { address, name: null, derivationPath: DERIVATION_PATH }
      : { address, name: null }
  ) as ExternallyOwnedAccount;
}

const CONTAINERS: Record<WalletKind, object> = {
  software: { seedType: 1 },
  ledger: { device: { productId: 1 }, provider: 'ledger' },
  readonly: { provider: null },
};

let walletKind: WalletKind;

beforeEach(() => {
  jest.clearAllMocks();
  getLedgerIframeController.mockReturnValue({
    getContentWindow: () => CONTENT_WINDOW,
  });
  walletPortRequest.mockImplementation(async (method, params) => {
    if (method === 'getWalletGroupByAddress') {
      return { walletContainer: CONTAINERS[walletKind] };
    }
    if (method === 'signSwapIntent') {
      return (params as { intent: IntentMultichain }).intent.solana
        ? SOLANA_FIXTURE.userSignedTransaction
        : EVM_SIGNATURE;
    }
    throw new Error(`unexpected walletPort method ${method}`);
  });
  hardwareRequest.mockResolvedValue(EVM_SIGNATURE);
  signSolanaTransaction.mockResolvedValue(SOLANA_FIXTURE.userSignedTransaction);
});

function signCalls() {
  return {
    signSwapIntent: walletPortRequest.mock.calls.filter(
      ([method]) => method === 'signSwapIntent'
    ),
    hardware: hardwareRequest.mock.calls,
    solanaHardware: signSolanaTransaction.mock.calls,
  };
}

describe('signIntent routing', () => {
  it('software EVM wallet: signSwapIntent over walletPort, nothing on the Ledger', async () => {
    walletKind = 'software';
    await expect(
      signIntent({ wallet: walletOf('software', 'evm'), intent: INTENTS.evm })
    ).resolves.toBe(EVM_SIGNATURE);
    const calls = signCalls();
    expect(calls.signSwapIntent).toEqual([
      ['signSwapIntent', { intent: INTENTS.evm }],
    ]);
    expect(calls.hardware).toEqual([]);
    expect(calls.solanaHardware).toEqual([]);
  });

  it('software Solana wallet: signSwapIntent over walletPort, nothing on the Ledger', async () => {
    walletKind = 'software';
    await expect(
      signIntent({
        wallet: walletOf('software', 'solana'),
        intent: INTENTS.solana,
      })
    ).resolves.toBe(SOLANA_FIXTURE.userSignedTransaction);
    const calls = signCalls();
    expect(calls.signSwapIntent).toEqual([
      ['signSwapIntent', { intent: INTENTS.solana }],
    ]);
    expect(calls.hardware).toEqual([]);
    expect(calls.solanaHardware).toEqual([]);
  });

  it('Ledger EVM account: signTypedData_v4 with the prepared document and derivationPath in the iframe', async () => {
    walletKind = 'ledger';
    await expect(
      signIntent({ wallet: walletOf('ledger', 'evm'), intent: INTENTS.evm })
    ).resolves.toBe(EVM_SIGNATURE);
    const calls = signCalls();
    expect(calls.hardware).toHaveLength(1);
    const [request, contentWindow] = calls.hardware[0] as [
      {
        method: string;
        params: {
          derivationPath: string;
          typedData: { types: Record<string, unknown>; domain: object };
        };
      },
      Window
    ];
    expect(contentWindow).toBe(CONTENT_WINDOW);
    expect(request.method).toBe('signTypedData_v4');
    expect(request.params.derivationPath).toBe(DERIVATION_PATH);
    expect(request.params.typedData.types.EIP712Domain).toEqual([
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]);
    expect(request.params.typedData.domain).toEqual({
      name: 'Permit2',
      chainId: 8453,
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
    });
    expect(calls.signSwapIntent).toEqual([]);
    expect(calls.solanaHardware).toEqual([]);
  });

  it('Ledger Solana account: signSolanaTransaction in the iframe', async () => {
    walletKind = 'ledger';
    await expect(
      signIntent({
        wallet: walletOf('ledger', 'solana'),
        intent: INTENTS.solana,
      })
    ).resolves.toBe(SOLANA_FIXTURE.userSignedTransaction);
    const calls = signCalls();
    expect(calls.solanaHardware).toEqual([
      [
        {
          transaction: SOLANA_FIXTURE.transaction,
          messageHandler: hardwareMessageHandler,
          derivationPath: DERIVATION_PATH,
          contentWindow: CONTENT_WINDOW,
        },
      ],
    ]);
    expect(calls.signSwapIntent).toEqual([]);
    expect(calls.hardware).toEqual([]);
  });

  it.each(['evm', 'solana'] as const)(
    'readonly %s wallet: rejected with no signing call',
    async (ecosystem) => {
      walletKind = 'readonly';
      await expect(
        signIntent({
          wallet: walletOf('readonly', ecosystem),
          intent: INTENTS[ecosystem],
        })
      ).rejects.toBeInstanceOf(ReadonlyWalletError);
      const calls = signCalls();
      expect(calls.signSwapIntent).toEqual([]);
      expect(calls.hardware).toEqual([]);
      expect(calls.solanaHardware).toEqual([]);
    }
  );

  it('control: the readonly wallet was looked up, so the rejection comes from the readonly check', async () => {
    walletKind = 'readonly';
    await signIntent({
      wallet: walletOf('readonly', 'evm'),
      intent: INTENTS.evm,
    }).catch(() => null);
    expect(walletPortRequest).toHaveBeenCalledWith('getWalletGroupByAddress', {
      address: EVM_ADDRESS,
    });
  });
});

function withZeroedSlot(transaction: string, index: number) {
  const decoded = VersionedTransaction.deserialize(
    Buffer.from(transaction, 'base64')
  );
  decoded.signatures[index] = new Uint8Array(SIGNATURE_LENGTH_IN_BYTES);
  return Buffer.from(decoded.serialize()).toString('base64');
}

describe('signIntent verifies the returned Solana transaction', () => {
  it.each(['software', 'ledger'] as const)(
    '%s: a returned transaction that drops the Jupiter signature throws IntentSignerSlotError',
    async (kind) => {
      walletKind = kind;
      const droppedJupiter = withZeroedSlot(
        SOLANA_FIXTURE.userSignedTransaction,
        0
      );
      walletPortRequest.mockImplementation(async (method) =>
        method === 'signSwapIntent'
          ? droppedJupiter
          : { walletContainer: CONTAINERS[kind] }
      );
      signSolanaTransaction.mockResolvedValue(droppedJupiter);
      await expect(
        signIntent({ wallet: walletOf(kind, 'solana'), intent: INTENTS.solana })
      ).rejects.toBeInstanceOf(IntentSignerSlotError);
    }
  );

  it.each(['software', 'ledger'] as const)(
    '%s: a returned transaction without the wallet signature throws IntentSignerSlotError',
    async (kind) => {
      walletKind = kind;
      walletPortRequest.mockImplementation(async (method) =>
        method === 'signSwapIntent'
          ? SOLANA_FIXTURE.transaction
          : { walletContainer: CONTAINERS[kind] }
      );
      signSolanaTransaction.mockResolvedValue(SOLANA_FIXTURE.transaction);
      await expect(
        signIntent({ wallet: walletOf(kind, 'solana'), intent: INTENTS.solana })
      ).rejects.toBeInstanceOf(IntentSignerSlotError);
    }
  );

  it.each(['software', 'ledger'] as const)(
    '%s: a wallet that is not a required signer throws IntentSignerSlotError before any signing call',
    async (kind) => {
      walletKind = kind;
      const notSigner = fakeSolTransaction('v0', {
        payer: JUPITER,
        owner: JUPITER,
      });
      await expect(
        signIntent({
          wallet: walletOf(kind, 'solana'),
          intent: { evm: null, solana: notSigner.transaction },
        })
      ).rejects.toBeInstanceOf(IntentSignerSlotError);
      const calls = signCalls();
      expect(calls.signSwapIntent).toEqual([]);
      expect(calls.solanaHardware).toEqual([]);
    }
  );
});
