import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import omit from 'lodash/omit';
import type { TypedDataDocument } from 'src/shared/types/Quote';
import {
  RELAY_PERMIT2_BATCH,
  RELAY_RECEIVE_WITH_AUTHORIZATION,
  UNISWAPX_DUTCH_V2,
  ZEROX_GASLESS_PERMIT,
  ZEROX_GASLESS_TRADE,
} from 'src/ui/shared/forms/trading/intentTypedData.fixtures';
import {
  JUPITER,
  STRANGER,
  USER,
  fakeSolTransaction,
  readSigned,
  type FakeSolTransactionKind,
} from 'src/modules/solana/fakeSolTransactions.fixtures';
import { IntentSignerSlotError } from 'src/modules/solana/intentSignerSlots';
import { emitter } from '../../events';
import { signSwapIntentPayload } from './signSwapIntentPayload';

const EVM_WALLET = new ethers.Wallet(
  '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318'
);
const USER_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(1));

const COW_ORDER: TypedDataDocument = {
  types: {
    Order: [
      { name: 'sellToken', type: 'address' },
      { name: 'buyToken', type: 'address' },
      { name: 'sellAmount', type: 'uint256' },
      { name: 'buyAmount', type: 'uint256' },
      { name: 'validTo', type: 'uint32' },
      { name: 'kind', type: 'string' },
    ],
  },
  primaryType: 'Order',
  domain: {
    name: 'Gnosis Protocol',
    version: 'v2',
    chainId: '8453',
    verifyingContract: '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
  },
  message: JSON.stringify({
    sellToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    buyToken: '0x4200000000000000000000000000000000000006',
    sellAmount: '100000000',
    buyAmount: '1',
    validTo: 1783000600,
    kind: 'sell',
  }),
};

const EVM_FIXTURES: Array<[string, TypedDataDocument]> = [
  ['EIP-2612 Permit', ZEROX_GASLESS_PERMIT],
  ['Permit2 PermitWitnessTransferFrom', ZEROX_GASLESS_TRADE],
  ['Permit2 PermitBatchWitnessTransferFrom', RELAY_PERMIT2_BATCH],
  ['UniswapX Permit2 witness', UNISWAPX_DUTCH_V2],
  ['EIP-3009 ReceiveWithAuthorization', RELAY_RECEIVE_WITH_AUTHORIZATION],
  ['provider order without EIP712Domain, message as a JSON string', COW_ORDER],
];

const keys = {
  getEvmSigner: () => EVM_WALLET,
  getSolanaKeypair: () => USER_KEYPAIR,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('signSwapIntentPayload — EVM', () => {
  it.each(EVM_FIXTURES)(
    '%s: the signature recovers to the wallet and no signing event is emitted',
    async (_label, document) => {
      const emit = jest.spyOn(emitter, 'emit');

      const signature = await signSwapIntentPayload(
        { evm: document, solana: null },
        keys
      );

      expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
      const message =
        typeof document.message === 'string'
          ? JSON.parse(document.message)
          : document.message;
      expect(
        ethers.verifyTypedData(
          document.domain,
          omit(document.types, 'EIP712Domain'),
          message,
          signature
        )
      ).toBe(EVM_WALLET.address);
      expect(emit).not.toHaveBeenCalledWith(
        'typedDataSigned',
        expect.anything()
      );
      expect(emit).not.toHaveBeenCalledWith('messageSigned', expect.anything());
      expect(emit).not.toHaveBeenCalled();
    }
  );
});

const KINDS: FakeSolTransactionKind[] = ['legacy', 'v0', 'v0-lookup-table'];

describe('signSwapIntentPayload — Solana', () => {
  const SIGNER_CASES = KINDS.flatMap((kind) => [
    [kind, 'the wallet is the only signer', { payer: USER, owner: USER }],
    [kind, 'Jupiter pays and has signed', { payer: JUPITER, owner: USER }],
  ]) as Array<
    [FakeSolTransactionKind, string, Parameters<typeof fakeSolTransaction>[1]]
  >;

  it.each(SIGNER_CASES)(
    '%s, %s: other slots stay byte-identical and the wallet slot holds a valid signature',
    async (kind, _label, fixtureKeys) => {
      const emit = jest.spyOn(emitter, 'emit');
      const fixture = fakeSolTransaction(kind, fixtureKeys);
      const sent = readSigned(kind, fixture.transaction);

      const signed = await signSwapIntentPayload(
        { evm: null, solana: fixture.transaction },
        keys
      );

      const returned = readSigned(kind, signed as typeof fixture.transaction);
      const userIndex = sent.signers.indexOf(USER.toBase58());
      expect(userIndex).toBeGreaterThanOrEqual(0);
      expect(returned.signers).toEqual(sent.signers);
      expect(returned.staticKeys).toEqual(sent.staticKeys);
      expect(returned.lookupTables).toEqual(sent.lookupTables);
      returned.signatures.forEach((slot, index) => {
        if (index !== userIndex) {
          expect(slot).toEqual(sent.signatures[index]);
        }
      });
      const messageBytes = VersionedTransaction.deserialize(
        Buffer.from(signed, 'base64')
      ).message.serialize();
      expect(
        nacl.sign.detached.verify(
          messageBytes,
          returned.signatures[userIndex],
          USER.toBytes()
        )
      ).toBe(true);
      expect(returned.signatures[userIndex]).toEqual(fixture.userSignature);
      expect(emit).not.toHaveBeenCalled();
    }
  );

  it('control: a Jupiter-paid transaction carries a Jupiter signature the wallet must keep', () => {
    const fixture = fakeSolTransaction('v0', { payer: JUPITER, owner: USER });
    const sent = readSigned('v0', fixture.transaction);
    expect(sent.signers).toEqual([JUPITER.toBase58(), USER.toBase58()]);
    expect(sent.signatures[0].some((byte) => byte !== 0)).toBe(true);
  });

  const NOT_SIGNER_CASES = KINDS.flatMap((kind) => [
    [kind, 'Jupiter is the only signer', { payer: JUPITER, owner: JUPITER }],
    [kind, 'Jupiter and a stranger sign', { payer: JUPITER, owner: STRANGER }],
  ]) as Array<
    [FakeSolTransactionKind, string, Parameters<typeof fakeSolTransaction>[1]]
  >;

  it.each(NOT_SIGNER_CASES)(
    '%s, %s: the wallet is not a required signer, so IntentSignerSlotError is thrown before signing',
    async (kind, _label, fixtureKeys) => {
      const fixture = fakeSolTransaction(kind, fixtureKeys);
      const sign = jest.spyOn(VersionedTransaction.prototype, 'sign');

      await expect(
        signSwapIntentPayload({ evm: null, solana: fixture.transaction }, keys)
      ).rejects.toBeInstanceOf(IntentSignerSlotError);
      expect(sign).not.toHaveBeenCalled();
    }
  );
});

describe('signSwapIntentPayload — malformed intent', () => {
  it('rejects an intent with neither payload', async () => {
    await expect(
      signSwapIntentPayload({ evm: null, solana: null }, keys)
    ).rejects.toThrow();
  });
});
