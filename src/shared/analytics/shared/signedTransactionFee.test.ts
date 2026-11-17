import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import { getSignedTransactionFeeParams } from './signedTransactionFee';

function context(overrides: Partial<TransactionContextParams> = {}): TransactionContextParams {
  return {
    chain: 'ethereum',
    feeValueCommon: null,
    initiator: 'https://extension',
    clientScope: 'Send',
    addressAction: null,
    ...overrides,
  } as TransactionContextParams;
}

const SIGNED_TX = {
  maxFeePerGas: '0x1e',
  maxPriorityFeePerGas: '0xa',
} as never;

describe('getSignedTransactionFeeParams', () => {
  test('reports the six fields for Ethereum', () => {
    const result = getSignedTransactionFeeParams({
      chain: 'ethereum',
      context: context({
        feeSpeed: 'average',
        feeBlock: 21_000_100,
        feeSource: 'fixed',
        feeFormulaVersion: 'v2',
      }),
      signedEvm: SIGNED_TX,
      provenance: {
        block: 21_000_100,
        source: 'fixed',
        formulaVersion: 'v2',
      },
    });
    expect(result).toEqual({
      fee_speed: 'average',
      max_fee_per_gas: '30',
      max_priority_fee_per_gas: '10',
      fee_block: 21_000_100,
      fee_source: 'fixed',
      fee_formula_version: 'v2',
    });
  });

  test('omits fee_speed and provenance without a speed setting', () => {
    const result = getSignedTransactionFeeParams({
      chain: 'ethereum',
      context: context(),
      signedEvm: SIGNED_TX,
      provenance: null,
    });
    expect(result.fee_speed).toBeUndefined();
    expect(result.fee_block).toBeNull();
    expect(result.fee_source).toBeNull();
    expect(result.fee_formula_version).toBeNull();
  });

  test('keeps descriptive fields and nulls the signed fees on failure', () => {
    const result = getSignedTransactionFeeParams({
      chain: 'ethereum',
      context: context({ feeSpeed: 'custom' }),
      signedEvm: null,
      provenance: { block: 1, source: 'p75', formulaVersion: 'v2' },
    });
    expect(result).toEqual({
      fee_speed: 'custom',
      max_fee_per_gas: null,
      max_priority_fee_per_gas: null,
      fee_block: null,
      fee_source: null,
      fee_formula_version: null,
    });
  });

  test('omits the fields on non-Ethereum chains', () => {
    expect(
      getSignedTransactionFeeParams({
        chain: 'polygon',
        context: context({ chain: 'polygon' }),
        signedEvm: SIGNED_TX,
        provenance: null,
      }),
    ).toEqual({});
  });
});
