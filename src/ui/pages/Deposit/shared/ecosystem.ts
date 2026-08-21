import type { OnrampEcosystem } from 'src/modules/zerion-api/types/DepositFlow';
import { getAddressType } from 'src/shared/wallet/classifiers';

/**
 * `deposit/suggested-tokens/v1` names the EVM ecosystem `ethereum`. It does not
 * validate the param — an unrecognised value silently returns the EVM list
 * rather than erroring — so the mapping is made explicitly here instead of
 * passing our own `BlockchainType` through and hoping.
 */
export function getOnrampEcosystem(address: string): OnrampEcosystem {
  return getAddressType(address) === 'solana' ? 'solana' : 'ethereum';
}
