import { describe, expect, it } from '@jest/globals';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import { mockStoreUnit } from './mockStoreUnit';
import {
  EVM_ADDRESS,
  NOW_MS,
  NOW_SECONDS,
  evmReadyRow,
} from './signPendingAction.fixtures';
import type { DismissSigner } from './dismissPendingAction';

mockStoreUnit();
const { createSignLock } = await import('./signLock');
const {
  DISMISS_PROOF_TTL_SECONDS,
  dismissPendingAction,
  getDismissExpireAt,
  getDismissMessage,
  signDismissMessage,
  toBase58SolanaSignature,
} = await import('./dismissPendingAction');

const CONTEXT = {
  initiator: 'chrome-extension://extension-id',
  clientScope: 'History',
};

// A deterministic Solana wallet whose signature TBG would verify with ed25519
const SOLANA_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(7));
const SOLANA_ADDRESS = SOLANA_KEYPAIR.publicKey.toBase58();
const EVM_WALLET = new ethers.Wallet(`0x${'11'.repeat(32)}`);

function signSolana(message: string) {
  return nacl.sign.detached(
    new TextEncoder().encode(message),
    SOLANA_KEYPAIR.secretKey
  );
}

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64');
}

function expectValidBase58Signature(signature: string, message: string) {
  const bytes = bs58.decode(signature);
  expect(bytes.length).toBe(64);
  expect(
    nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bytes,
      SOLANA_KEYPAIR.publicKey.toBytes()
    )
  ).toBe(true);
}

describe('getDismissMessage', () => {
  it.each([
    {
      actionId: '6f1d3a9c2b7e4d8f0a5c1e3b7d9f2a4c',
      expireAt: 1791298800,
      expected:
        'Hide this transaction.\n\n\n\n\nzerion:dismiss-action:6f1d3a9c2b7e4d8f0a5c1e3b7d9f2a4c:1791298800',
    },
    {
      actionId: 'ord_01JBX2Q9-zz',
      expireAt: 1,
      expected:
        'Hide this transaction.\n\n\n\n\nzerion:dismiss-action:ord_01JBX2Q9-zz:1',
    },
  ])(
    'is byte-identical to TBG for $actionId',
    ({ actionId, expireAt, expected }) => {
      const message = getDismissMessage(actionId, expireAt);
      expect(message).toBe(expected);
      expect(Buffer.from(message, 'utf8')).toEqual(
        Buffer.from(expected, 'utf8')
      );
      expect(message.split('\n')).toHaveLength(6);
    }
  );

  it('expires one hour after the current whole second', () => {
    expect(DISMISS_PROOF_TTL_SECONDS).toBe(3600);
    expect(getDismissExpireAt(1791295200999)).toBe(1791298800);
    expect(getDismissExpireAt(1791295200000)).toBe(1791298800);
  });
});

describe('dismissPendingAction', () => {
  it('sends the signed caption as the proof, then hides the row', async () => {
    const row = evmReadyRow();
    const expectedExpireAt = NOW_SECONDS + 3600;
    const expectedMessage = `Hide this transaction.\n\n\n\n\nzerion:dismiss-action:${row.pendingActionId}:${expectedExpireAt}`;
    const signature = await EVM_WALLET.signMessage(expectedMessage);
    const calls: string[] = [];
    const dismissCalls: unknown[] = [];

    const result = await dismissPendingAction(row, {
      lock: createSignLock(),
      nowMs: () => NOW_MS + 500,
      confirmAndSign: async ({ message }) => {
        calls.push('confirmAndSign');
        expect(message).toBe(expectedMessage);
        return signature;
      },
      dismissAction: async (params) => {
        calls.push('dismissAction');
        dismissCalls.push(params);
      },
      onDismissed: () => calls.push('onDismissed'),
    });

    expect(result).toEqual({ kind: 'dismissed' });
    expect(calls).toEqual(['confirmAndSign', 'dismissAction', 'onDismissed']);
    expect(dismissCalls).toEqual([
      {
        actionId: row.pendingActionId,
        proof: { address: EVM_ADDRESS, expireAt: expectedExpireAt, signature },
      },
    ]);
  });

  it('sends nothing when the dialog is cancelled', async () => {
    const calls: string[] = [];
    const result = await dismissPendingAction(evmReadyRow(), {
      lock: createSignLock(),
      nowMs: () => NOW_MS,
      confirmAndSign: async () => null,
      dismissAction: async () => calls.push('dismissAction'),
      onDismissed: () => calls.push('onDismissed'),
    });
    expect(result).toEqual({ kind: 'cancelled' });
    expect(calls).toEqual([]);
  });
});

describe('signDismissMessage', () => {
  const message = getDismissMessage(
    '6f1d3a9c2b7e4d8f0a5c1e3b7d9f2a4c',
    1791298800
  );

  function softwareSigner(
    ecosystem: 'evm' | 'solana',
    calls: unknown[]
  ): DismissSigner {
    return {
      kind: 'software',
      ecosystem,
      signMessage: async (params) => {
        calls.push(['signMessage', params]);
        return EVM_WALLET.signMessage(params.message);
      },
      solanaSignMessageWithAddress: async (params) => {
        calls.push(['solana_signMessageWithAddress', params]);
        const signed = signSolana(ethers.toUtf8String(params.messageHex));
        return { signatureSerialized: toBase64(signed) };
      },
    };
  }

  function ledgerSigner(
    ecosystem: 'evm' | 'solana',
    output: (bytes: Uint8Array) => string
  ): DismissSigner {
    return {
      kind: 'ledger',
      ecosystem,
      personalSign: async (value) =>
        (await EVM_WALLET.signMessage(value)).slice(2),
      solana_signMessage: async (messageHex) =>
        output(signSolana(ethers.toUtf8String(messageHex))),
    };
  }

  it('returns the software EVM signature as 0x-hex that recovers the signer', async () => {
    const calls: unknown[] = [];
    const signature = await signDismissMessage({
      signer: softwareSigner('evm', calls),
      address: EVM_WALLET.address,
      message,
      messageContextParams: CONTEXT,
    });
    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect(ethers.verifyMessage(message, signature)).toBe(EVM_WALLET.address);
    expect(calls).toEqual([
      [
        'signMessage',
        {
          signerAddress: EVM_WALLET.address,
          message,
          messageContextParams: CONTEXT,
        },
      ],
    ]);
  });

  it('converts the base64 software Solana signature to base58', async () => {
    const calls: unknown[] = [];
    const signature = await signDismissMessage({
      signer: softwareSigner('solana', calls),
      address: SOLANA_ADDRESS,
      message,
      messageContextParams: CONTEXT,
    });
    expectValidBase58Signature(signature, message);
    expect(calls).toEqual([
      [
        'solana_signMessageWithAddress',
        {
          signerAddress: SOLANA_ADDRESS,
          messageHex: ethers.hexlify(ethers.toUtf8Bytes(message)),
          ...CONTEXT,
        },
      ],
    ]);
  });

  it('prefixes the Ledger EVM signature to 0x-hex', async () => {
    const signature = await signDismissMessage({
      signer: ledgerSigner('evm', bs58.encode),
      address: EVM_WALLET.address,
      message,
      messageContextParams: CONTEXT,
    });
    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect(ethers.verifyMessage(message, signature)).toBe(EVM_WALLET.address);
  });

  it.each([
    { name: 'base58', output: (bytes: Uint8Array) => bs58.encode(bytes) },
    { name: 'base64', output: toBase64 },
    { name: '0x-hex', output: (bytes: Uint8Array) => ethers.hexlify(bytes) },
    {
      name: 'bare hex',
      output: (bytes: Uint8Array) => ethers.hexlify(bytes).slice(2),
    },
  ])(
    'normalises a $name Ledger Solana signature to base58',
    async ({ output }) => {
      const signature = await signDismissMessage({
        signer: ledgerSigner('solana', output),
        address: SOLANA_ADDRESS,
        message,
        messageContextParams: CONTEXT,
      });
      expectValidBase58Signature(signature, message);
    }
  );

  it('rejects a Solana signature that is not 64 bytes', () => {
    expect(() => toBase58SolanaSignature(toBase64(new Uint8Array(65)))).toThrow(
      'Unexpected Solana signature format'
    );
  });
});
