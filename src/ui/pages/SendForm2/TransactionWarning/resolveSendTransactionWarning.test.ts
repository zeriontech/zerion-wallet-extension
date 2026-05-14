import BigNumber from 'bignumber.js';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import {
  backendErrorToMessage,
  resolveSendTransactionWarning,
} from './resolveSendTransactionWarning';

describe('backendErrorToMessage', () => {
  it('maps code 1 with asset symbol', () => {
    const error: TransactionPrepareError = {
      code: 1,
      message: 'raw',
      hint: null,
    };
    expect(backendErrorToMessage(error, { assetSymbol: 'USDC' })).toBe(
      'Insufficient USDC balance'
    );
  });

  it('maps code 1 without asset symbol', () => {
    const error: TransactionPrepareError = {
      code: 1,
      message: 'raw',
      hint: null,
    };
    expect(backendErrorToMessage(error, {})).toBe('Insufficient balance');
  });

  it('maps code 2 with native symbol', () => {
    const error: TransactionPrepareError = {
      code: 2,
      message: 'raw',
      hint: null,
    };
    expect(backendErrorToMessage(error, { nativeAssetSymbol: 'ETH' })).toBe(
      'Insufficient ETH for gas'
    );
  });

  it('maps code 2 without native symbol', () => {
    const error: TransactionPrepareError = {
      code: 2,
      message: 'raw',
      hint: null,
    };
    expect(backendErrorToMessage(error, {})).toBe(
      'Insufficient balance for gas'
    );
  });

  it('falls back to error.message for unknown codes', () => {
    const error = {
      code: 99 as unknown as 1,
      message: 'something else',
      hint: null,
    } as TransactionPrepareError;
    expect(backendErrorToMessage(error, {})).toBe('something else');
  });
});

describe('resolveSendTransactionWarning — backendError', () => {
  it('returns an error variant warning when backendError is present', () => {
    const error: TransactionPrepareError = {
      code: 1,
      message: 'raw',
      hint: null,
    };
    const resolved = resolveSendTransactionWarning({
      simulationResult: null,
      backendError: error,
      assetSymbol: 'USDC',
    });
    expect(resolved.warning).toEqual({
      variant: 'error',
      title: 'Insufficient USDC balance',
      description: undefined,
    });
    expect(resolved.blocksAutoSign).toBe(true);
    expect(resolved.dangerTitle).toBeNull();
    expect(resolved.unverified).toBe(false);
  });

  it('returns no warning when both simulationResult and backendError are absent', () => {
    const resolved = resolveSendTransactionWarning({ simulationResult: null });
    expect(resolved.warning).toBeNull();
    expect(resolved.blocksAutoSign).toBe(false);
  });
});

describe('max-send predicate', () => {
  // Mirrors the predicate used in useSendTransaction:
  //   BigNumber(typedAmountTokenUnits).eq(position.amount.quantity)
  function isMax(typed: string, balance: string) {
    return new BigNumber(typed).eq(balance);
  }

  it('is true when typed amount equals balance exactly', () => {
    expect(isMax('1', '1')).toBe(true);
    expect(isMax('1.0', '1')).toBe(true);
    expect(isMax('0.123456789', '0.123456789')).toBe(true);
  });

  it('is false when typed amount differs', () => {
    expect(isMax('0.999', '1')).toBe(false);
    expect(isMax('1.0001', '1')).toBe(false);
  });
});

describe('Received-line comparison', () => {
  // Mirrors SendDetails: show only when backend's inputAmount.quantity !== typed.
  function showReceived(receivedQuantity: string, typed: string | null) {
    if (!typed) return false;
    return !new BigNumber(receivedQuantity).eq(typed);
  }

  it('hides when amounts match', () => {
    expect(showReceived('1', '1')).toBe(false);
    expect(showReceived('1.0', '1')).toBe(false);
  });

  it('shows when amounts differ (max-send gas shave case)', () => {
    expect(showReceived('0.998', '1')).toBe(true);
  });

  it('hides when typed is null', () => {
    expect(showReceived('1', null)).toBe(false);
  });
});
