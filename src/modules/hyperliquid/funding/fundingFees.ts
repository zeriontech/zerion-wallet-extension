import type { Quote2 } from 'src/shared/types/Quote';

export interface FundingFeeSummary {
  provider: string | null;
  outputUsdc: number | null;
  networkFeeUsd: number | null;
  bridgeFeeUsd: number | null;
  protocolFeeUsd: number | null;
  totalFeeUsd: number | null;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseQuantity(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Actual fees for the selected route, from the quote the user would sign.
 * Null fields mean the quote did not report that fee; the UI must not invent
 * zeros for them.
 */
export function getFundingFeeSummary(quote: Quote2 | null | undefined): FundingFeeSummary {
  if (!quote) {
    return {
      provider: null,
      outputUsdc: null,
      networkFeeUsd: null,
      bridgeFeeUsd: null,
      protocolFeeUsd: null,
      totalFeeUsd: null,
    };
  }
  const networkFeeUsd = finiteOrNull(quote.networkFee?.amount?.usdValue);
  const bridgeFeeUsd = finiteOrNull(quote.bridgeFee?.amount?.usdValue);
  const protocolFeeUsd = finiteOrNull(quote.protocolFee?.amount?.usdValue);
  const feeValues = [networkFeeUsd, bridgeFeeUsd, protocolFeeUsd].filter(
    (value): value is number => value != null,
  );
  return {
    provider: quote.contractMetadata?.name ?? null,
    outputUsdc: parseQuantity(quote.outputAmount?.quantity),
    networkFeeUsd,
    bridgeFeeUsd,
    protocolFeeUsd,
    totalFeeUsd: feeValues.length ? feeValues.reduce((sum, value) => sum + value, 0) : null,
  };
}
