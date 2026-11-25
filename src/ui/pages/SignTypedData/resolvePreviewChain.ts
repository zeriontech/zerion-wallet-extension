import {
  isCanonicalSafeTx,
  parseSafeTxChainId,
} from 'src/modules/ethereum/message-signing/canonicalSafeTx';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';

/**
 * The chain a signature preview should render and simulate on.
 *
 * A canonical SafeTx belongs to the chain in its EIP-712 domain, which can
 * differ from the chain the dapp currently has selected for its origin (for
 * example app.safe.global previewing a Base transaction while Ethereum is
 * selected). Every other payload keeps the origin chain, and so does a SafeTx
 * whose domain chain is missing or unsupported.
 */
export function resolvePreviewChain({
  typedData,
  fallbackChain,
  networks,
}: {
  typedData: TypedData;
  fallbackChain: Chain;
  networks: Pick<Networks, 'hasNetworkById' | 'getChainById'>;
}): Chain {
  if (!isCanonicalSafeTx(typedData)) {
    return fallbackChain;
  }
  const chainId = parseSafeTxChainId(typedData.domain.chainId);
  if (chainId == null || !networks.hasNetworkById(chainId)) {
    return fallbackChain;
  }
  return networks.getChainById(chainId);
}
