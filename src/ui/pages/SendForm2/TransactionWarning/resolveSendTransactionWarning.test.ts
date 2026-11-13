import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import { getSendErrorCopy, resolveSendTransactionWarning } from './resolveSendTransactionWarning';

describe('getSendErrorCopy', () => {
  it.each([
    [1, { assetSymbol: 'USDC' }, 'Insufficient USDC balance'],
    [1, {}, 'Insufficient balance'],
    [2, { nativeAssetSymbol: 'ETH' }, 'Insufficient ETH for gas'],
    [2, {}, 'Insufficient balance for gas'],
  ])('maps code %i with context %j to "%s" regardless of message', (code, context, title) => {
    for (const message of ['raw', 'zzz']) {
      const error: TransactionPrepareError = { code, message, hint: 1 };
      expect(getSendErrorCopy(error, context)).toEqual({
        title,
        description: null,
      });
    }
  });

  it.each([0, 3, 4, 5, 6, 7, 99, -1])('uses the server message verbatim for code %i', (code) => {
    const error: TransactionPrepareError = {
      code,
      message: `server message ${code}`,
      hint: 0,
    };
    expect(
      getSendErrorCopy(error, {
        assetSymbol: 'USDC',
        nativeAssetSymbol: 'ETH',
      }),
    ).toEqual({ title: `server message ${code}`, description: null });
  });

  it('shows the code 5 server message', () => {
    const error: TransactionPrepareError = {
      code: 5,
      message: "This token can't be transferred",
      hint: 0,
    };
    expect(getSendErrorCopy(error, {})).toEqual({
      title: "This token can't be transferred",
      description: null,
    });
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

  it.each([
    [{ code: 1, message: 'raw', hint: 1 }, 'Insufficient USDC balance'],
    [{ code: 2, message: 'raw', hint: 1 }, 'Insufficient ETH for gas'],
    [
      { code: 5, message: "This token can't be transferred", hint: 0 },
      "This token can't be transferred",
    ],
    [{ code: 99, message: 'unknown', hint: null }, 'unknown'],
  ])('returns the full warning for %j', (error, title) => {
    const backendError: TransactionPrepareError = error;
    expect(
      resolveSendTransactionWarning({
        simulationResult: null,
        backendError,
        assetSymbol: 'USDC',
        nativeAssetSymbol: 'ETH',
      }),
    ).toEqual({
      warning: { variant: 'error', title, description: undefined },
      unverified: false,
      blocksAutoSign: true,
      dangerTitle: null,
    });
  });

  it('returns no warning when both simulationResult and backendError are absent', () => {
    const resolved = resolveSendTransactionWarning({ simulationResult: null });
    expect(resolved.warning).toBeNull();
    expect(resolved.blocksAutoSign).toBe(false);
  });
});
