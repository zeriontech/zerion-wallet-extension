import { describe, expect, it, vi } from 'vite-plus/test';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import {
  type PermitSigner,
  PermitSigningError,
  getSigningStepState,
  signPermitBatch,
} from './signPermitBatch';
import { UntrustedPermitPayloadError } from './permitPayload';

const ADDRESS = '0xAbC0000000000000000000000000000000000001';

function createPermit(chain: string, chainId: number, contractAddress?: string): Permit {
  const issued = contractAddress ?? `0x${String(chainId).padStart(40, '0')}`;
  return {
    chain,
    contracts: [issued],
    expireAt: '2099-01-01T00:00:00Z',
    eip712: {
      domain: {
        name: 'Decryption',
        version: '1',
        chainId: String(chainId),
        verifyingContract: '0x0000000000000000000000000000000000000002',
        salt: null,
      },
      types: {
        UserDecryptRequestVerification: [{ name: 'contractAddresses', type: 'address[]' }],
      },
      primaryType: 'UserDecryptRequestVerification',
      message: { contractAddresses: [issued] },
    },
  };
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
    const sign = vi.fn(async (typedData: TypedData) => `sig:${typedData.domain.chainId}`);

    const result = await signPermitBatch(ADDRESS, permits, sign, {
      onStep: (index) => steps.push(index),
      onSigned: (index) => signed.push(index),
    });

    expect(steps).toEqual([0, 1, 2]);
    expect(signed).toEqual([0, 1, 2]);
    expect(result.map((permit) => permit.signature)).toEqual(['sig:1', 'sig:8453', 'sig:42161']);
    expect(result.map((permit) => permit.chain)).toEqual(['ethereum', 'base', 'arbitrum']);
    expect(result.every((permit) => permit.address === ADDRESS.toLowerCase())).toBe(true);
  });

  it('is all-or-nothing: a rejection midway carries its index and yields nothing', async () => {
    const steps: number[] = [];
    const signed: number[] = [];
    const denied = new Error('Signature denied by user');
    const sign = vi.fn<PermitSigner>().mockResolvedValueOnce('sig:1').mockRejectedValueOnce(denied);

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
    const sign = vi.fn<PermitSigner>();
    await expect(signPermitBatch(ADDRESS, [], sign)).resolves.toEqual([]);
    expect(sign).not.toHaveBeenCalled();
  });

  it('matches issued and requested contracts case-insensitively', async () => {
    const permit = createPermit('ethereum', 1, '0xAbC0000000000000000000000000000000000003');
    permit.eip712.message.contractAddresses = ['0xabc0000000000000000000000000000000000003'];
    const sign = vi.fn<PermitSigner>(async () => 'sig');

    await expect(signPermitBatch(ADDRESS, [permit], sign)).resolves.toHaveLength(1);
  });

  it('refuses any payload that is not a Zama decryption request', async () => {
    const wrongPrimaryType = createPermit('ethereum', 1);
    wrongPrimaryType.eip712.primaryType = 'Permit';
    const wrongDomain = createPermit('base', 8453);
    wrongDomain.eip712.domain.name = 'Zama';
    const sign = vi.fn<PermitSigner>();

    for (const permit of [wrongPrimaryType, wrongDomain]) {
      const promise = signPermitBatch(ADDRESS, [permit], sign);
      await expect(promise).rejects.toBeInstanceOf(PermitSigningError);
      await promise.catch((error: PermitSigningError) => {
        expect(error.index).toBe(0);
        expect(error.cause).toBeInstanceOf(UntrustedPermitPayloadError);
      });
    }
    expect(sign).not.toHaveBeenCalled();
  });

  it('refuses a contract outside the issued set before signing anything', async () => {
    const valid = createPermit('ethereum', 1);
    const other = createPermit('base', 8453);
    other.eip712.message.contractAddresses = ['0x9999999999999999999999999999999999999999'];
    const sign = vi.fn<PermitSigner>();

    const promise = signPermitBatch(ADDRESS, [valid, other], sign);
    await expect(promise).rejects.toBeInstanceOf(PermitSigningError);
    await promise.catch((error: PermitSigningError) => {
      expect(error.index).toBe(1);
      expect(error.cause).toBeInstanceOf(UntrustedPermitPayloadError);
    });
    expect(sign).not.toHaveBeenCalled();
  });

  it('refuses an address list that is not all strings', async () => {
    const permit = createPermit('ethereum', 1);
    permit.eip712.message.contractAddresses = [null];
    const sign = vi.fn<PermitSigner>();

    await expect(signPermitBatch(ADDRESS, [permit], sign)).rejects.toBeInstanceOf(
      PermitSigningError,
    );
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
