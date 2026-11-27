import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import {
  getHyperliquidSignatureSummary,
  HYPERLIQUID_USER_SIGNED_DOMAIN_NAME,
} from 'src/modules/hyperliquid/security/hyperliquidTypedData';

/**
 * Properties added to `Transaction: Signed Message` for Hyperliquid
 * user-signed actions. Kept out of every other typed-data event so the
 * dimension does not fragment unrelated signatures.
 */
export function getHyperliquidSignedMessageProperties(
  typedData: TypedData | undefined,
): Record<string, string | null> {
  if (!typedData || typedData.domain?.name !== HYPERLIQUID_USER_SIGNED_DOMAIN_NAME) {
    return {};
  }
  const summary = getHyperliquidSignatureSummary(typedData);
  if (!summary) return {};
  return {
    typed_data_primary_type: summary.rawPrimaryType,
    hl_builder: summary.kind === 'approveBuilderFee' ? (summary.builder ?? null) : null,
    hl_max_fee_rate: summary.kind === 'approveBuilderFee' ? (summary.maxFeeRate ?? null) : null,
  };
}
