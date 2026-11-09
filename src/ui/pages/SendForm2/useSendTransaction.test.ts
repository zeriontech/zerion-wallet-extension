import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { TransactionGetSendResult } from 'src/modules/zerion-api/hooks/useTransactionGetSend';
import type { Params } from 'src/modules/zerion-api/requests/transaction-get-send';
import { transactionGetSendQueryOptions } from 'src/modules/zerion-api/hooks/useTransactionGetSend';
import { selectCurrentSendResponse } from './shared/selectCurrentSendResponse';

// The real client transitively imports the extension runtime
vi.mock('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { transactionGetSend: vi.fn() },
}));

const inputAmount = {
  currency: 'usd',
  quantity: '1',
  value: 1,
  usdValue: 1,
};

const networkFee = {
  free: false,
  amount: { quantity: '0.0004', value: 1.2, usdValue: 1.2 },
  fungible: null,
};

const successResponse: TransactionGetSendResult = {
  inputAmount,
  error: null,
  networkFee,
  transactionSend: {
    evm: {
      type: '0x2',
      from: '0xfrom',
      to: '0xto',
      nonce: '0x1',
      chainId: '0x1',
      gas: '0x5208',
      gasPrice: null,
      maxFee: '0x1',
      maxPriorityFee: '0x1',
      value: '0x0',
      data: '0x',
      customData: null,
    },
    solana: null,
  },
};

const code5Response: TransactionGetSendResult = {
  inputAmount,
  error: { code: 5, message: "This token can't be transferred", hint: 0 },
  networkFee: null,
  transactionSend: null,
};

const code2WithFeeResponse: TransactionGetSendResult = {
  inputAmount,
  error: { code: 2, message: 'not enough base asset', hint: 1 },
  networkFee,
  transactionSend: null,
};

describe('selectCurrentSendResponse', () => {
  it.each([
    ['success', successResponse],
    ['code 5', code5Response],
    ['code 2 with fee', code2WithFeeResponse],
  ])('drops a previous %s response', (_name, response) => {
    expect(selectCurrentSendResponse(response, true)).toBeUndefined();
  });

  it.each([
    ['success', successResponse],
    ['code 5', code5Response],
    ['code 2 with fee', code2WithFeeResponse],
  ])('passes the current %s response through', (_name, response) => {
    expect(selectCurrentSendResponse(response, false)).toBe(response);
  });

  it('returns undefined without data', () => {
    expect(selectCurrentSendResponse(undefined, false)).toBeUndefined();
    expect(selectCurrentSendResponse(undefined, true)).toBeUndefined();
  });
});

describe('transactionGetSendQueryOptions with a pending follow-up request', () => {
  const transactionGetSend = vi.mocked(ZerionAPI.transactionGetSend);

  const firstParams: Params = {
    currency: 'usd',
    chain: 'ethereum',
    from: '0xfrom',
    to: '0xto',
    assetId: 'usdc',
    amount: '1',
  };
  const secondParams: Params = { ...firstParams, amount: '2' };

  it('exposes nothing from the previous response while the new one is pending', async () => {
    // The follow-up request never settles.
    const pendingFetch = new Promise<never>(() => {});
    transactionGetSend.mockImplementation(((params: Params) =>
      params.amount === '1'
        ? Promise.resolve({ data: successResponse })
        : pendingFetch) as unknown as typeof transactionGetSend);
    const queryClient = new QueryClient({
      logger: { log: () => null, warn: () => null, error: () => null },
    });
    const observer = new QueryObserver<TransactionGetSendResult>(
      queryClient,
      transactionGetSendQueryOptions(firstParams, 'mainnet'),
    );
    let firstResultResolve = () => {};
    const firstResult = new Promise<void>((resolve) => {
      firstResultResolve = resolve;
    });
    const unsubscribe = observer.subscribe((result) => {
      if (result.isSuccess) firstResultResolve();
    });

    await firstResult;
    const first = observer.getCurrentResult();
    expect(selectCurrentSendResponse(first.data, first.isPreviousData)).toEqual(successResponse);

    observer.setOptions(transactionGetSendQueryOptions(secondParams, 'mainnet'));
    const pending = observer.getCurrentResult();
    expect(pending.fetchStatus).toBe('fetching');
    expect(selectCurrentSendResponse(pending.data, pending.isPreviousData)).toBeUndefined();

    unsubscribe();
    queryClient.clear();
  });
});
