import BigNumber from 'bignumber.js';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import { responseToTransactionGetSendError } from 'src/modules/zerion-api/hooks/transactionGetSendError';
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

describe('resolveSendTransactionWarning — requestError', () => {
  function requestError(status: number, body: string) {
    return responseToTransactionGetSendError(new Response(body, { status }));
  }

  it('renders the 422 not-transferable body verbatim', async () => {
    const resolved = resolveSendTransactionWarning({
      simulationResult: null,
      requestError: await requestError(
        422,
        '{"meta":null,"data":null,"errors":[{"title":"Unable to send","detail":"This token can\'t be transferred"}]}'
      ),
    });
    expect(resolved).toEqual({
      warning: {
        variant: 'error',
        title: 'Unable to send',
        description: "This token can't be transferred",
      },
      unverified: false,
      blocksAutoSign: true,
      dangerTitle: null,
    });
  });

  it.each([
    [
      400,
      '{"meta":null,"data":null,"errors":[{"title":"Bad request","detail":"Invalid parameter"}]}',
      'Bad request',
      'Invalid parameter',
    ],
    [
      404,
      '{"meta":null,"data":null,"errors":[{"title":"Resource not found","detail":"Not found"}]}',
      'Resource not found',
      'Not found',
    ],
    [422, '{"errors":[{"title":"Only a title"}]}', 'Only a title', undefined],
    [
      422,
      '{"errors":[{"detail":"Only a detail"}]}',
      'Unable to send',
      'Only a detail',
    ],
    [
      403,
      '<!DOCTYPE html><html>Just a moment...</html>',
      'Unable to send',
      undefined,
    ],
    [422, '{}', 'Unable to send', undefined],
    [422, '{"errors":[]}', 'Unable to send', undefined],
  ])(
    'renders a %i response body %s as an error warning',
    async (status, body, title, description) => {
      const resolved = resolveSendTransactionWarning({
        simulationResult: null,
        requestError: await requestError(status, body),
      });
      expect(resolved.warning).toEqual({
        variant: 'error',
        title,
        description,
      });
      expect(resolved.blocksAutoSign).toBe(true);
      expect(resolved.dangerTitle).toBeNull();
    }
  );

  it('produces no warning for a 500 response', async () => {
    const resolved = resolveSendTransactionWarning({
      simulationResult: null,
      requestError: await requestError(
        500,
        '{"errors":[{"title":"Internal","detail":"Boom"}]}'
      ),
    });
    expect(resolved.warning).toBeNull();
  });
});
