import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from './types';

/**
 * Provenance attached to a signed transaction's analytics (WLT-2742/2743):
 * the newest sampled block, the formula part that set the tip, and the
 * gas-service formula version. Optional fields stay `null` when the gas-price
 * answer does not carry them (older responses, non-Ethereum chains).
 */
export interface FeeProvenance {
  block: number | null;
  source: string | null;
  formulaVersion: string | null;
}

function readFormulaVersion(gasPrices: ChainGasPrice): string | null {
  // ZPI serializes this endpoint camelCase (`formulaVersion`), but the exact
  // wire spelling of the new field is unverified; accept the proto spelling
  // too, so a mismatch only costs the field and never the event.
  const readable = gasPrices as unknown as {
    formulaVersion?: unknown;
    formula_version?: unknown;
  };
  if (typeof readable.formulaVersion === 'string') {
    return readable.formulaVersion;
  }
  if (typeof readable.formula_version === 'string') {
    return readable.formula_version;
  }
  return null;
}

/**
 * Provenance of `speed`'s answer. A `custom` price has no gas-service answer of
 * its own, so only the formula version is reported for it.
 */
export function getFeeProvenance(
  gasPrices: ChainGasPrice | null | undefined,
  speed: NetworkFeeSpeed | null | undefined,
): FeeProvenance | null {
  if (!gasPrices) {
    return null;
  }
  const answer = speed === 'average' || speed === 'fast' ? gasPrices[speed] : null;
  const formulaVersion = readFormulaVersion(gasPrices);
  if (!answer && formulaVersion == null) {
    return null;
  }
  return {
    block: typeof answer?.block === 'number' ? answer.block : null,
    source: typeof answer?.source === 'string' ? answer.source : null,
    formulaVersion,
  };
}
