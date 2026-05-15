import { jest, describe, test, expect } from '@jest/globals';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type {
  ExchangePlaceOrderAction,
  ExchangeRequestBody,
} from '../actions/types';
import type { ExchangeResponse } from '../api/submitExchangeAction.types';
import type { PreflightFetchInput, PreflightState } from './preflightState';
import {
  runIntent,
  type PerpsIntent,
  type RunIntentContext,
} from './runIntent';
import { HyperliquidExchangeError } from './signAndSubmit';

type SubmitFn = (body: ExchangeRequestBody) => Promise<ExchangeResponse>;
type SignFn = (typedData: TypedData) => Promise<string>;
type FetchPreflightFn = (input: PreflightFetchInput) => Promise<PreflightState>;

// Dummy 65-byte hex signature (r=…01, s=…02, v=27)
const DUMMY_SIGNATURE =
  '0x' +
  '01'.repeat(32) + // r
  '02'.repeat(32) + // s
  '1b'; // v = 27

const TEST_CONTEXT: RunIntentContext = {
  address: '0x1111111111111111111111111111111111111111',
  builder: '0x2222222222222222222222222222222222222222',
  requiredMaxBuilderFee: 100,
  referralCode: 'ZERION',
};

const FULLY_CONFIGURED: PreflightState = {
  hyperliquidEnabled: true,
  referrerSet: true,
  builderFeeApproved: true,
  currentLeverage: { value: 5, isCross: true },
};

const BRAND_NEW: PreflightState = {
  hyperliquidEnabled: false,
  referrerSet: false,
  builderFeeApproved: false,
  currentLeverage: null,
};

function makeOrderIntent(overrides: Partial<PerpsIntent> = {}): PerpsIntent {
  const order: ExchangePlaceOrderAction = {
    type: 'order',
    grouping: 'na',
    orders: [
      {
        a: 0,
        b: true,
        p: '50000',
        s: '0.001',
        r: false,
        t: { limit: { tif: 'Ioc' } },
      },
    ],
  };
  return {
    kind: 'open',
    coin: 'BTC',
    asset: 0,
    isCross: true,
    desiredLeverage: 5,
    order,
    successText: 'Position opened',
    ...overrides,
  } as PerpsIntent;
}

type StartFn = (args: { kind: string; label: string }) => string;
type AdvanceFn = (args: { label: string }) => void;
type SucceedFn = (args: { text: string }) => void;
type FailFn = (error: Error) => void;

function makeStoreMock() {
  return {
    start: jest.fn<StartFn>(() => 'session-id'),
    advance: jest.fn<AdvanceFn>(),
    succeed: jest.fn<SucceedFn>(),
    fail: jest.fn<FailFn>(),
  };
}

function okResponse(): ExchangeResponse {
  return {
    status: 'ok',
    response: { type: 'order', data: { statuses: [{ resting: { oid: 1 } }] } },
  };
}

function makeSubmit(impl?: SubmitFn) {
  const fn = jest.fn<SubmitFn>();
  if (impl) {
    fn.mockImplementation(impl);
  } else {
    fn.mockResolvedValue(okResponse());
  }
  return fn;
}

function makeSign() {
  return jest.fn<SignFn>().mockResolvedValue(DUMMY_SIGNATURE);
}

function makeFetchPreflight(value: PreflightState | PreflightState[]) {
  const fn = jest.fn<FetchPreflightFn>();
  if (Array.isArray(value)) {
    for (const v of value) fn.mockResolvedValueOnce(v);
  } else {
    fn.mockResolvedValue(value);
  }
  return fn;
}

function orderStatusResponse(
  statuses: Array<
    | { error: string }
    | { resting: { oid: number } }
    | { filled: { totalSz: string; avgPx: string; oid: number } }
  >
): ExchangeResponse {
  return {
    status: 'ok',
    response: { type: 'order', data: { statuses } },
  };
}

function errResponse(message: string): ExchangeResponse {
  return { status: 'err', response: message };
}

function submittedTypes(submit: ReturnType<typeof makeSubmit>): string[] {
  return submit.mock.calls.map(([body]) => body.action.type);
}

describe('runIntent', () => {
  test('brand-new user: runs all 4 preflight steps before placeOrder', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(BRAND_NEW);

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(fetchPreflightState).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(5);
    expect(signTypedData).toHaveBeenCalledTimes(5);

    expect(submittedTypes(submit)).toEqual([
      'userSetAbstraction',
      'setReferrer',
      'approveBuilderFee',
      'updateLeverage',
      'order',
    ]);

    expect(store.start).toHaveBeenCalledTimes(1);
    expect(store.succeed).toHaveBeenCalledWith({ text: 'Position opened' });
    expect(store.fail).not.toHaveBeenCalled();
  });

  test('returning user with everything set up: only the order is submitted', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(FULLY_CONFIGURED);

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submittedTypes(submit)).toEqual(['order']);
    expect(store.succeed).toHaveBeenCalledTimes(1);
  });

  test('open intent with mismatched leverage value: updateLeverage + order run', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight({
      ...FULLY_CONFIGURED,
      currentLeverage: { value: 10, isCross: true },
    });

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['updateLeverage', 'order']);
  });

  test('open intent with matching value but mismatched margin type: updateLeverage + order run', async () => {
    // Hyperliquid rejects flipping cross↔isolated while a position is open, but
    // for a new "open" without an existing position the type can still be set.
    // The orchestrator's job is to push the leverage action whenever value OR
    // type differs from what's currently on-chain.
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight({
      ...FULLY_CONFIGURED,
      currentLeverage: { value: 5, isCross: false },
    });

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['updateLeverage', 'order']);
  });

  test('add intent: never re-sets leverage even on value mismatch (position dictates leverage)', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight({
      ...FULLY_CONFIGURED,
      currentLeverage: { value: 10, isCross: true },
    });

    await runIntent({
      intent: makeOrderIntent({ kind: 'add' } as Partial<PerpsIntent>),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['order']);
  });

  test('add intent on an isolated position: no margin-type flip (no updateLeverage)', async () => {
    // Regression: previously the orchestrator pushed updateLeverage with
    // isCross=true while the user held an isolated position, which Hyperliquid
    // rejects with "Cannot switch leverage type with open position."
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight({
      ...FULLY_CONFIGURED,
      currentLeverage: { value: 1, isCross: false },
    });

    await runIntent({
      intent: makeOrderIntent({
        kind: 'add',
        isCross: false,
        desiredLeverage: 1,
      } as Partial<PerpsIntent>),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['order']);
  });

  test('close intent: never re-sets leverage even if mismatch', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight({
      ...FULLY_CONFIGURED,
      currentLeverage: { value: 10, isCross: true },
    });

    await runIntent({
      intent: makeOrderIntent({ kind: 'close' } as Partial<PerpsIntent>),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['order']);
  });

  test('emits start / advance / succeed in order with the correct labels', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(BRAND_NEW);

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(store.start).toHaveBeenCalledWith({
      kind: 'perps-open',
      label: 'Preparing order…',
    });
    const advanceLabels = store.advance.mock.calls.map(([arg]) => arg.label);
    expect(advanceLabels).toEqual([
      'Enabling Hyperliquid…',
      'Setting referrer…',
      'Approving builder fee…',
      'Setting leverage…',
      'Placing order…',
    ]);
    expect(store.succeed).toHaveBeenCalledWith({ text: 'Position opened' });
  });

  test('mid-flow rejection: re-queries /info and resumes with refreshed preflight', async () => {
    const store = makeStoreMock();
    const signTypedData = makeSign();

    const fetchPreflightState = makeFetchPreflight([
      BRAND_NEW,
      FULLY_CONFIGURED,
    ]);

    let call = 0;
    const submit = makeSubmit(async () => {
      call += 1;
      if (call === 5) return errResponse('Order rejected: rate-limited');
      return okResponse();
    });

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(fetchPreflightState).toHaveBeenCalledTimes(2);
    expect(submittedTypes(submit)).toEqual([
      'userSetAbstraction',
      'setReferrer',
      'approveBuilderFee',
      'updateLeverage',
      'order',
      'order',
    ]);
    expect(store.succeed).toHaveBeenCalledTimes(1);
    expect(store.fail).not.toHaveBeenCalled();
  });

  test('second rejection is terminal: fail() is emitted', async () => {
    const store = makeStoreMock();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(FULLY_CONFIGURED);
    const submit = makeSubmit(async () => errResponse('Insufficient margin'));

    await expect(
      runIntent({
        intent: makeOrderIntent(),
        context: TEST_CONTEXT,
        deps: { signTypedData, submit, fetchPreflightState, store },
      })
    ).rejects.toBeInstanceOf(HyperliquidExchangeError);

    expect(store.fail).toHaveBeenCalledTimes(1);
    const failedError = store.fail.mock.calls[0][0];
    expect(failedError.message).toBe('Insufficient margin');
  });

  test('withdraw intent skips referrer/builder/leverage steps', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(BRAND_NEW);

    await runIntent({
      intent: {
        kind: 'withdraw',
        amount: '25',
        destination: TEST_CONTEXT.address,
        successText: 'Withdrawal submitted',
      },
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['userSetAbstraction', 'withdraw3']);
    expect(store.succeed).toHaveBeenCalledWith({
      text: 'Withdrawal submitted',
    });
  });

  test('inner-status error on main leg: outer ok but data.statuses[0].error → fail()', async () => {
    const store = makeStoreMock();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(FULLY_CONFIGURED);
    // Both attempts (initial + retry-after-refresh) return inner-status errors.
    const submit = makeSubmit(async () =>
      orderStatusResponse([{ error: 'Order has invalid size' }])
    );

    await expect(
      runIntent({
        intent: makeOrderIntent(),
        context: TEST_CONTEXT,
        deps: { signTypedData, submit, fetchPreflightState, store },
      })
    ).rejects.toBeInstanceOf(HyperliquidExchangeError);

    expect(store.fail).toHaveBeenCalledTimes(1);
    expect(store.succeed).not.toHaveBeenCalled();
    const failedError = store.fail.mock.calls[0][0];
    expect(failedError.message).toBe('Order has invalid size');
  });

  test('inner-status error triggers preflight refresh + retry, then succeeds', async () => {
    const store = makeStoreMock();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight([
      FULLY_CONFIGURED,
      FULLY_CONFIGURED,
    ]);
    let call = 0;
    const submit = makeSubmit(async () => {
      call += 1;
      if (call === 1) {
        return orderStatusResponse([{ error: 'Order has invalid size' }]);
      }
      return orderStatusResponse([{ resting: { oid: 42 } }]);
    });

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(fetchPreflightState).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(store.succeed).toHaveBeenCalledWith({ text: 'Position opened' });
    expect(store.fail).not.toHaveBeenCalled();
  });

  test('TP/SL leg failure: main leg fills, late leg error → succeed-with-warning', async () => {
    const store = makeStoreMock();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(FULLY_CONFIGURED);
    const submit = makeSubmit(async () =>
      orderStatusResponse([
        { filled: { totalSz: '0.001', avgPx: '50000', oid: 1 } },
        { error: 'Trigger price too close to mark' },
      ])
    );

    await runIntent({
      intent: makeOrderIntent(),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(store.succeed).toHaveBeenCalledTimes(1);
    expect(store.succeed).toHaveBeenCalledWith({
      text: 'Position opened, TP/SL failed: Trigger price too close to mark',
    });
    expect(store.fail).not.toHaveBeenCalled();
  });

  test('updateLeverage intent: only the leverage action when account is set up', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight({
      ...FULLY_CONFIGURED,
      currentLeverage: { value: 2, isCross: true },
    });

    await runIntent({
      intent: {
        kind: 'updateLeverage',
        coin: 'BTC',
        asset: 0,
        isCross: true,
        desiredLeverage: 5,
        successText: 'Leverage updated',
      },
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(submittedTypes(submit)).toEqual(['updateLeverage']);
  });

  test('preflight input forwards dexIdentifier so builder-DEX coins read the right account', async () => {
    const store = makeStoreMock();
    const submit = makeSubmit();
    const signTypedData = makeSign();
    const fetchPreflightState = makeFetchPreflight(FULLY_CONFIGURED);

    await runIntent({
      intent: makeOrderIntent({
        coin: 'xyz:SP500',
        dexIdentifier: 'xyz',
      } as Partial<PerpsIntent>),
      context: TEST_CONTEXT,
      deps: { signTypedData, submit, fetchPreflightState, store },
    });

    expect(fetchPreflightState).toHaveBeenCalledTimes(1);
    expect(fetchPreflightState.mock.calls[0][0]).toMatchObject({
      coin: 'xyz:SP500',
      dexIdentifier: 'xyz',
    });
  });
});
