import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';

const PRIMARY_TYPE = 'UserDecryptRequestVerification';
const DOMAIN_NAME = 'Decryption';
const CONTRACT_ADDRESSES = 'contractAddresses';

export class UntrustedPermitPayloadError extends Error {
  constructor() {
    super('The decryption permit does not match the contracts issued by the backend');
    this.name = 'UntrustedPermitPayloadError';
  }
}

/**
 * A permit is only worth a signature when it asks Zama to decrypt the
 * contracts the backend issued it for. Anything else — a different primary
 * type or domain, an unparseable address list, or a contract outside the
 * issued set — is refused before the signer sees it. Mirrors the iOS
 * `PermitPayloadValidator`.
 */
export function validatePermitPayload(permit: Permit): void {
  const { domain, primaryType, message } = permit.eip712;
  if (primaryType !== PRIMARY_TYPE || domain.name !== DOMAIN_NAME) {
    throw new UntrustedPermitPayloadError();
  }

  const requested = message[CONTRACT_ADDRESSES];
  if (!Array.isArray(requested) || requested.some((address) => typeof address !== 'string')) {
    throw new UntrustedPermitPayloadError();
  }

  const issued = new Set(permit.contracts.map((address) => address.toLowerCase()));
  if (!requested.every((address) => issued.has((address as string).toLowerCase()))) {
    throw new UntrustedPermitPayloadError();
  }
}
