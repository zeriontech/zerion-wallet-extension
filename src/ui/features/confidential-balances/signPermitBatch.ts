import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { toStoredPermit } from 'src/shared/confidential-balances/permits';
import type { StoredPermit } from 'src/shared/types/ConfidentialPermit';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { toTypedData } from './toTypedData';

/** Produces one EIP-712 signature; software (background) or Ledger (device) */
export type PermitSigner = (typedData: TypedData) => Promise<string>;

/** Carries the index of the permit whose signature failed out of the loop */
export class PermitSigningError extends Error {
  index: number;
  cause: unknown;
  constructor(index: number, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'PermitSigningError';
    this.index = index;
    this.cause = cause;
  }
}

/**
 * Signs Permits one after another with the given signer and returns the
 * Signed Permits in the same order. Stores nothing: a failure at any index
 * rejects with a `PermitSigningError` and nothing signed so far survives —
 * one Reveal is all-or-nothing, for the silent and the Ledger flow alike.
 *
 * `onStep(index)` fires right before permit `index` is handed to the signer,
 * `onSigned(index, permit)` right after it came back.
 */
export async function signPermitBatch(
  address: string,
  permits: Permit[],
  sign: PermitSigner,
  {
    onStep,
    onSigned,
  }: {
    onStep?: (index: number) => void;
    onSigned?: (index: number, permit: Permit) => void;
  } = {}
): Promise<StoredPermit[]> {
  const stored: StoredPermit[] = [];
  const normalizedAddress = normalizeAddress(address);
  for (const [index, permit] of permits.entries()) {
    onStep?.(index);
    let signature: string;
    try {
      signature = await sign(toTypedData(permit.eip712));
    } catch (error) {
      throw new PermitSigningError(index, error);
    }
    stored.push(toStoredPermit(normalizedAddress, permit, signature));
    onSigned?.(index, permit);
  }
  return stored;
}

/** State of one row in the Signing steps, derived from the running index */
export type SigningStepState = 'signed' | 'signing' | 'pending';

export function getSigningStepState(
  index: number,
  /** Index of the permit on the device now; `permits.length` once all signed */
  currentIndex: number
): SigningStepState {
  if (index < currentIndex) {
    return 'signed';
  }
  return index === currentIndex ? 'signing' : 'pending';
}
