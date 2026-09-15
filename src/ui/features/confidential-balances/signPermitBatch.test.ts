import { describe, expect, it, jest } from '@jest/globals';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import {
  type PermitSigner,
  PermitSigningError,
  getSigningStepState,
  signPermitBatch,
} from './signPermitBatch';

const ADDRESS = '0xAbC0000000000000000000000000000000000001';

function createPermit(chain: string, chainId: number): Permit {
  return {
    chain,
    contracts: [`0x${chainId}`],
    expireAt: '2099-01-01T00:00:00Z',
    eip712: {
      domain: {
        name: 'Zama',
        version: '1',
        chainId: String(chainId),
        verifyingContract: '0x0000000000000000000000000000000000000002',
        salt: null,
      },
      types: {
        Permit: [{ name: 'publicKey', type: 'bytes' }],
      },
      primaryType: 'Permit',
      message: { publicKey: '0x01' },
    },
  } as unknown as Permit;
}

const permits = [
  createPermit('ethereum', 1),
  createPermit('base', 8453),
  createPermit('arbitrum', 42161),
];

describe('signPermitBatch', () => {
  it('signs every permit in order and reports each step', async () => {
    const steps: number[] = [];
    const signed: number[] = [];
    const sign = jest.fn(
      async (typedData: TypedData) => `sig:${typedData.domain.chainId}`
    );

    const result = await signPermitBatch(ADDRESS, permits, sign, {
      onStep: (index) => steps.push(index),
      onSigned: (index) => signed.push(index),
    });

    expect(steps).toEqual([0, 1, 2]);
    expect(signed).toEqual([0, 1, 2]);
    expect(result.map((permit) => permit.signature)).toEqual([
      'sig:1',
      'sig:8453',
      'sig:42161',
    ]);
    expect(result.map((permit) => permit.chain)).toEqual([
      'ethereum',
      'base',
      'arbitrum',
    ]);
    expect(
      result.every((permit) => permit.address === ADDRESS.toLowerCase())
    ).toBe(true);
  });

  it('is all-or-nothing: a rejection midway carries its index and yields nothing', async () => {
    const steps: number[] = [];
    const signed: number[] = [];
    const denied = new Error('Signature denied by user');
    const sign = jest
      .fn<PermitSigner>()
      .mockResolvedValueOnce('sig:1')
      .mockRejectedValueOnce(denied);

    const promise = signPermitBatch(ADDRESS, permits, sign, {
      onStep: (index) => steps.push(index),
      onSigned: (index) => signed.push(index),
    });

    await expect(promise).rejects.toBeInstanceOf(PermitSigningError);
    await promise.catch((error: PermitSigningError) => {
      expect(error.index).toBe(1);
      expect(error.cause).toBe(denied);
      expect(error.message).toBe('Signature denied by user');
    });
    // the third permit was never sent to the device
    expect(sign).toHaveBeenCalledTimes(2);
    expect(steps).toEqual([0, 1]);
    expect(signed).toEqual([0]);
  });

  it('returns an empty batch for no permits without calling the signer', async () => {
    const sign = jest.fn<PermitSigner>();
    await expect(signPermitBatch(ADDRESS, [], sign)).resolves.toEqual([]);
    expect(sign).not.toHaveBeenCalled();
  });
});

describe('getSigningStepState', () => {
  it('marks rows before the current index signed, the current one signing, the rest pending', () => {
    expect([0, 1, 2].map((index) => getSigningStepState(index, 1))).toEqual([
      'signed',
      'signing',
      'pending',
    ]);
  });

  it('marks every row signed once the index passed the last permit', () => {
    expect([0, 1, 2].map((index) => getSigningStepState(index, 3))).toEqual([
      'signed',
      'signed',
      'signed',
    ]);
  });

  it('marks every row pending on a restart from the first permit', () => {
    expect([0, 1, 2].map((index) => getSigningStepState(index, 0))).toEqual([
      'signing',
      'pending',
      'pending',
    ]);
  });
});
