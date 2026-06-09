import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type {
  ExchangeAction,
  ExchangePlaceOrderAction,
  ExchangeRequestBody,
} from '../actions/types';
import { buildSetAbstractionAction } from '../actions/buildSetAbstractionAction';
import { buildSetReferrerAction } from '../actions/buildSetReferrerAction';
import { buildApproveBuilderFeeAction } from '../actions/buildApproveBuilderFeeAction';
import { buildUpdateLeverageAction } from '../actions/buildUpdateLeverageAction';
import { buildWithdraw3Action } from '../actions/buildWithdraw3Action';
import { builderFeeUnitToMaxFeeRateString } from '../fees/calculateFeeRate';
import {
  getOrderLegError,
  isOrderResponseBody,
  type ExchangeResponse,
} from '../api/submitExchangeAction.types';
import type * as PerpsActivityStore from '../perpsActivityStore';
import type { PerpsActivityKind } from '../perpsActivityStore';
import {
  HyperliquidExchangeError,
  signAndSubmit,
  type SignAndSubmitDeps,
} from './signAndSubmit';
import {
  fetchPreflightState as defaultFetchPreflightState,
  type PreflightFetchInput,
  type PreflightState,
} from './preflightState';

type PlaceOrderIntent = {
  kind: 'open' | 'add' | 'close';
  coin: string;
  /** Builder-DEX identifier (e.g. "xyz"); omitted for main-DEX coins. */
  dexIdentifier?: string;
  asset: number;
  isCross: boolean;
  desiredLeverage: number;
  order: ExchangePlaceOrderAction;
  /** Success-toast text shown after the orchestrator finishes. */
  successText: string;
};

type UpdateLeverageIntent = {
  kind: 'updateLeverage';
  coin: string;
  dexIdentifier?: string;
  asset: number;
  isCross: boolean;
  desiredLeverage: number;
  successText: string;
};

type WithdrawIntent = {
  kind: 'withdraw';
  amount: string;
  destination: string;
  successText: string;
};

export type PerpsIntent =
  | PlaceOrderIntent
  | UpdateLeverageIntent
  | WithdrawIntent;

export interface RunIntentContext {
  address: string;
  builder: string;
  /** Required max builder fee (1e6-denominated). */
  requiredMaxBuilderFee: number;
  referralCode: string;
}

type StoreApi = Pick<
  typeof PerpsActivityStore,
  'start' | 'advance' | 'succeed' | 'fail'
>;

export interface RunIntentDeps {
  signTypedData: (typedData: TypedData) => Promise<string>;
  submit?: (body: ExchangeRequestBody) => Promise<ExchangeResponse>;
  fetchPreflightState?: (input: PreflightFetchInput) => Promise<PreflightState>;
  store?: StoreApi;
  now?: () => number;
}

const ACTIVITY_KIND_BY_INTENT: Record<PerpsIntent['kind'], PerpsActivityKind> =
  {
    open: 'perps-open',
    add: 'perps-add',
    close: 'perps-close',
    updateLeverage: 'perps-open',
    withdraw: 'perps-withdraw',
  };

const STARTING_LABEL_BY_INTENT: Record<PerpsIntent['kind'], string> = {
  open: 'Preparing order…',
  add: 'Preparing order…',
  close: 'Preparing order…',
  updateLeverage: 'Updating leverage…',
  withdraw: 'Preparing withdrawal…',
};

interface PreflightStep {
  label: string;
  buildAction: (nonce: number) => ExchangeAction;
}

function buildPreflightSteps(
  intent: PerpsIntent,
  context: RunIntentContext,
  state: PreflightState
): PreflightStep[] {
  const steps: PreflightStep[] = [];

  if (intent.kind === 'withdraw') {
    // Withdraw requires the account to exist; everything else (referrer,
    // builder fee, leverage) is order-flow specific.
    if (!state.hyperliquidEnabled) {
      steps.push({
        label: 'Enabling Hyperliquid…',
        buildAction: (nonce) =>
          buildSetAbstractionAction({ user: context.address, nonce }),
      });
    }
    return steps;
  }

  if (!state.hyperliquidEnabled) {
    steps.push({
      label: 'Enabling Hyperliquid…',
      buildAction: (nonce) =>
        buildSetAbstractionAction({ user: context.address, nonce }),
    });
  }

  if (intent.kind !== 'updateLeverage' && !state.referrerSet) {
    steps.push({
      label: 'Setting referrer…',
      buildAction: () => buildSetReferrerAction({ code: context.referralCode }),
    });
  }

  if (intent.kind !== 'updateLeverage' && !state.builderFeeApproved) {
    steps.push({
      label: 'Approving builder fee…',
      buildAction: (nonce) =>
        buildApproveBuilderFeeAction({
          maxFeeRate: builderFeeUnitToMaxFeeRateString(
            context.requiredMaxBuilderFee
          ),
          builder: context.builder,
          nonce,
        }),
    });
  }

  // Margin-type flips ('cross' ↔ 'isolated') are rejected by Hyperliquid while
  // a position is open. For `add` and `close`, the existing position dictates
  // leverage and type — never push an updateLeverage step on those flows.
  // For `open` (a new position into the same coin), only update when value OR
  // type differs from what's currently set on-chain.
  const leverageMatches =
    state.currentLeverage != null &&
    state.currentLeverage.value === intent.desiredLeverage &&
    state.currentLeverage.isCross === intent.isCross;
  const needsLeverage = !leverageMatches && intent.kind === 'open';

  if (needsLeverage) {
    steps.push({
      label: 'Setting leverage…',
      buildAction: () =>
        buildUpdateLeverageAction({
          asset: intent.asset,
          isCross: intent.isCross,
          leverage: intent.desiredLeverage,
        }),
    });
  }

  return steps;
}

function buildMainStep(intent: PerpsIntent): PreflightStep {
  switch (intent.kind) {
    case 'open':
    case 'add':
    case 'close':
      return {
        label: intent.kind === 'close' ? 'Closing position…' : 'Placing order…',
        buildAction: () => intent.order,
      };
    case 'updateLeverage':
      return {
        label: 'Updating leverage…',
        buildAction: () =>
          buildUpdateLeverageAction({
            asset: intent.asset,
            isCross: intent.isCross,
            leverage: intent.desiredLeverage,
          }),
      };
    case 'withdraw':
      return {
        label: 'Submitting withdrawal…',
        buildAction: (nonce) =>
          buildWithdraw3Action({
            amount: intent.amount,
            destination: intent.destination,
            time: nonce,
          }),
      };
  }
}

function intentToPreflightInput(
  intent: PerpsIntent,
  context: RunIntentContext
): PreflightFetchInput {
  return {
    address: context.address,
    builder: context.builder,
    requiredMaxBuilderFee: context.requiredMaxBuilderFee,
    coin: intent.kind === 'withdraw' ? undefined : intent.coin,
    dexIdentifier:
      intent.kind === 'withdraw' ? undefined : intent.dexIdentifier,
  };
}

/**
 * Run a perps intent end-to-end: query /info for preflight state, execute the
 * minimal preflight + main action sequence, and emit progress to the perps
 * activity store. Side-effects (HTTP, signing, store) are all injected via
 * `deps` so the orchestrator is unit-testable in isolation.
 *
 * If the main action is rejected by /exchange, we re-query /info once and
 * retry the remaining steps with the refreshed preflight (the rejection may
 * have left half-completed state on Hyperliquid's side). A second rejection
 * is final.
 */
export async function runIntent(args: {
  intent: PerpsIntent;
  context: RunIntentContext;
  deps: RunIntentDeps;
}): Promise<void> {
  const { intent, context, deps } = args;
  // Lazy-load the runtime store so test files that pass `deps.store` don't
  // transitively pull in nanoevents/nanoid (ESM — chokes ts-jest's CJS pipeline).
  const store: StoreApi = deps.store ?? (await import('../perpsActivityStore'));
  const fetchPreflight = deps.fetchPreflightState ?? defaultFetchPreflightState;
  const now = deps.now ?? Date.now;

  const kind = ACTIVITY_KIND_BY_INTENT[intent.kind];
  // Withdraw carries no coin (it moves USDC off the perps account); every other
  // intent acts on a specific position, so its coin drives the toaster icon.
  const coin = intent.kind === 'withdraw' ? null : intent.coin;
  store.start({
    kind,
    label: STARTING_LABEL_BY_INTENT[intent.kind],
    coin,
  });

  const signAndSubmitDeps: SignAndSubmitDeps = {
    signTypedData: deps.signTypedData,
    submit: deps.submit,
  };

  try {
    const preflightInput = intentToPreflightInput(intent, context);
    let preflightState = await fetchPreflight(preflightInput);
    let steps = [
      ...buildPreflightSteps(intent, context, preflightState),
      buildMainStep(intent),
    ];

    let stepIndex = 0;
    let retriedAfterRejection = false;
    let legWarning: string | null = null;

    while (stepIndex < steps.length) {
      const step = steps[stepIndex];
      store.advance({ label: step.label });
      const nonce = now();
      const action = step.buildAction(nonce);
      const isMainStep = stepIndex === steps.length - 1;
      try {
        const response = await signAndSubmit(
          { action, nonce },
          signAndSubmitDeps
        );
        // Hyperliquid wraps per-leg order failures inside an outer status:'ok'.
        // For `order`-type actions we must inspect response.data.statuses[i]
        // before treating the call as a real fill. Status[0] is the main leg
        // (open/add/close); later entries are TP/SL legs in grouped orders.
        if (action.type === 'order' && response.status === 'ok') {
          const body = response.response;
          if (isOrderResponseBody(body)) {
            const statuses = body.data.statuses;
            const mainErr = statuses[0] ? getOrderLegError(statuses[0]) : null;
            if (mainErr) {
              throw new HyperliquidExchangeError(mainErr);
            }
            const legErrors = statuses
              .slice(1)
              .map(getOrderLegError)
              .filter((e): e is string => e !== null);
            if (legErrors.length > 0) {
              legWarning = legErrors.join('; ');
            }
          }
        }
        stepIndex += 1;
      } catch (error) {
        if (isMainStep && !retriedAfterRejection) {
          retriedAfterRejection = true;
          legWarning = null;
          // Re-derive preflight state and resume from wherever we are.
          preflightState = await fetchPreflight(preflightInput);
          steps = [
            ...buildPreflightSteps(intent, context, preflightState),
            buildMainStep(intent),
          ];
          stepIndex = 0;
          continue;
        }
        throw error;
      }
    }

    const successText = legWarning
      ? `${intent.successText}, TP/SL failed: ${legWarning}`
      : intent.successText;
    store.succeed({ text: successText });
  } catch (error) {
    store.fail(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
