import type { TransactionGetSendResult } from 'src/modules/zerion-api/hooks/useTransactionGetSend';
import { jest } from '@jest/globals';
import { TransactionGetSendError } from 'src/modules/zerion-api/hooks/transactionGetSendError';

// The hooks and local prep path reach extension-only and ESM-only modules jest can't load
for (const [path, name] of [
  ['src/modules/currency/useCurrency', 'useCurrency'],
  ['src/ui/features/preferences/usePreferences', 'usePreferences'],
  ['src/modules/zerion-api/hooks/useHttpClientSource', 'useHttpClientSource'],
  [
    'src/modules/zerion-api/hooks/useTransactionGetSend',
    'useTransactionGetSend',
  ],
  ['src/ui/pages/SendForm2/shared/prepareSendData', 'prepareSendData'],
]) {
  jest.unstable_mockModule(path, () => ({ [name]: jest.fn() }));
}
const { selectBackendSendTransaction } = await import('./useSendTransaction');

const previousSuccess: TransactionGetSendResult = {
  inputAmount: { currency: 'usd', quantity: '1', value: 1, usdValue: 1 },
  error: null,
  networkFee: {
    free: false,
    amount: { quantity: '0.0001', value: 0.3, usdValue: 0.3 },
    fungible: null,
  },
  transactionSend: { evm: null, solana: 'previous-token-tx' },
};

describe('selectBackendSendTransaction', () => {
  it('drops previous data while the request is in error', () => {
    expect(
      selectBackendSendTransaction(
        {
          data: previousSuccess,
          error: new TransactionGetSendError(422, null),
        },
        { network: null, currency: 'usd' }
      )
    ).toBeUndefined();
  });

  it('maps a successful response to a send quote', () => {
    expect(
      selectBackendSendTransaction(
        { data: previousSuccess, error: null },
        { network: null, currency: 'eur' }
      )
    ).toEqual({
      network: null,
      sendQuote: {
        transactionSwap: { evm: null, solana: 'previous-token-tx' },
        networkFee: {
          free: false,
          amount: {
            quantity: '0.0001',
            value: 0.3,
            usdValue: 0.3,
            currency: 'eur',
          },
          fungible: null,
        },
      },
      inputAmount: { currency: 'usd', quantity: '1', value: 1, usdValue: 1 },
      error: null,
    });
  });
});
