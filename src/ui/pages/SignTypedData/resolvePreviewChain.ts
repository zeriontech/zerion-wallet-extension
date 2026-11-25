import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { normalizeChainId } from 'src/shared/normalizeChainId';

const HEX_CHAIN_ID = /^0x[0-9a-fA-F]+$/;
const DECIMAL_CHAIN_ID = /^\d+$/;

/**
 * Canonicalizes a domain chain id to this repo's chain-collection key (`0x1`).
 * Dapps send the EIP-712 integer as a decimal string, a hex string with
 * optional zero padding (`0x01`) or a number; ethers accepts all of them, so
 * the preview must treat them as the same chain.
 */
function toCanonicalChainId(value: string | number): ChainId | null {
  let numeric: bigint;
  try {
    numeric = BigInt(value);
  } catch {
    return null;
  }
  if (numeric <= 0n) {
    return null;
  }
  try {
    return normalizeChainId(numeric.toString(10));
  } catch {
    // Malformed values must keep the preview on the origin chain, never throw.
    return null;
  }
}

/**
 * The EIP-712 domain chain id of a canonical SafeTx, or null for anything
 * else. Only a payload that declares itself as a SafeTx, carries the SafeTx
 * type and has a well-formed domain chain id qualifies: dapps send the id as
 * a decimal string, a hex string or a number, and anything else keeps the
 * preview on the dapp's selected chain.
 */
export function getSafeTxDomainChainId(typedData: TypedData): ChainId | null {
  if (typedData.primaryType !== 'SafeTx') {
    return null;
  }
  if (!Array.isArray(typedData.types?.SafeTx)) {
    return null;
  }
  const chainId = typedData.domain?.chainId;
  if (typeof chainId === 'number') {
    return Number.isSafeInteger(chainId) && chainId > 0 ? toCanonicalChainId(chainId) : null;
  }
  if (typeof chainId !== 'string') {
    return null;
  }
  const value = chainId.trim();
  if (!HEX_CHAIN_ID.test(value) && !DECIMAL_CHAIN_ID.test(value)) {
    return null;
  }
  return toCanonicalChainId(value);
}

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
  const chainId = getSafeTxDomainChainId(typedData);
  if (chainId == null || !networks.hasNetworkById(chainId)) {
    return fallbackChain;
  }
  return networks.getChainById(chainId);
}
