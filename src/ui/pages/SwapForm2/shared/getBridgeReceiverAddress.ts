import { normalizeAddress } from 'src/shared/normalizeAddress';

/** The bridge recipient, or `null` when the output goes back to the signing address. */
export function getBridgeReceiverAddress({
  address,
  to,
}: {
  address: string;
  to: string | undefined | null;
}): string | null {
  if (!to || normalizeAddress(to) === normalizeAddress(address)) {
    return null;
  }
  return to;
}
