import type { Quote2 } from 'src/shared/types/Quote';
import {
  isExecutableQuote,
  isIntentQuote,
  toIncomingTransaction,
  toMultichainTransaction,
} from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SwapFormState } from 'src/shared/types/SwapFormState';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import {
  createApproveAddressAction2,
  createBridgeAddressAction2,
  createTradeAddressAction2,
} from 'src/modules/ethereum/transactions/addressAction/addressActionMain';
import { isDeviceAccount } from 'src/shared/types/validators';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { invariant } from 'src/shared/invariant';
import type {
  SignStep,
  ToasterView,
} from 'src/ui/components/TransactionSigner';

const withNonce = (
  tx: MultichainTransaction,
  nonce: number
): MultichainTransaction => (tx.evm ? { evm: { ...tx.evm, nonce } } : tx);

// Quote-derived EVM txs come back with a backend-assigned nonce that's stale
// once another queue is in flight. Strip it so prepareNonce recomputes against
// the freshest local+RPC state at sign time.
const withoutNonce = (tx: MultichainTransaction): MultichainTransaction => {
  if (!tx.evm) return tx;
  const { nonce: _omit, ...rest } = tx.evm;
  return { evm: rest as typeof tx.evm };
};

export interface BuildSwapStepsParams {
  /** Quote as displayed (amounts, provider, intents) */
  quote: Quote2;
  /** Same quote with the local network-fee override applied to its transactions */
  configuredQuote: Quote2;
  wallet: ExternallyOwnedAccount;
  address: string;
  currency: string;
  /** Exact form state the quote stream was requested with (for the Re-quote) */
  quotesFormState: SwapFormState;
  inputFungible: Fungible;
  outputFungible: Fungible;
  inputNetwork: NetworkConfig;
  outputNetwork: NetworkConfig;
  /** Output network id as reported to analytics / the Order */
  outputChain: string;
  spendAmount: Amount;
  interpretationAction: AnyAddressAction | null;
  /** User-entered nonce; applies to step 0 only */
  userNonce: number | null;
  receiverAddress: string | null;
  isCrossChain: boolean;
  clientScope: { approve: string; swap: string };
  actionType?: { approve?: string; swap?: string };
  warningWasShown: boolean;
  outputAmountColor: 'grey' | 'red';
  toaster: { approve: ToasterView; swap: ToasterView };
}

/**
 * Builds the signing queue for an Executable Quote (PRD §4.4). Step 0 is an
 * optional On-chain Approval (`send`); then either the On-chain Swap (`send`,
 * unchanged behaviour) or the Intent Swap (`order`, with a Re-quote iff an
 * approval was mined first). Both kinds are first-class: the branch keys off
 * the quote's own fields only.
 */
export function buildSwapSteps({
  quote,
  configuredQuote,
  wallet,
  address,
  currency,
  quotesFormState,
  inputFungible,
  outputFungible,
  inputNetwork,
  outputNetwork,
  outputChain,
  spendAmount,
  interpretationAction,
  userNonce,
  receiverAddress,
  isCrossChain,
  clientScope,
  actionType,
  warningWasShown,
  outputAmountColor,
  toaster,
}: BuildSwapStepsParams): SignStep[] {
  invariant(isExecutableQuote(quote), 'Quote must be executable');
  const steps: SignStep[] = [];
  const feeValueCommon = quote.networkFee?.amount?.quantity || '0';
  const inputChain = inputNetwork.id;

  const hasApproveStep = Boolean(configuredQuote.transactionApprove);
  if (configuredQuote.transactionApprove) {
    const approveTx = configuredQuote.transactionApprove;
    invariant(
      approveTx.evm,
      'Approve transaction must be EVM (Solana has no allowance step)'
    );
    const fallbackApproveAction = createApproveAddressAction2({
      transaction: toIncomingTransaction(approveTx.evm),
      hash: null,
      explorerUrl: null,
      fungible: inputFungible,
      amount: spendAmount,
      network: inputNetwork,
    });
    const approveMultichain = toMultichainTransaction(approveTx);
    steps.push({
      kind: 'send',
      params: {
        transaction:
          userNonce != null
            ? withNonce(approveMultichain, userNonce)
            : withoutNonce(approveMultichain),
        chain: inputChain,
        initiator: INTERNAL_ORIGIN,
        clientScope: clientScope.approve,
        actionType: actionType?.approve,
        feeValueCommon,
        addressAction: interpretationAction ?? fallbackApproveAction,
        warningWasShown,
        outputAmountColor,
      },
      // Ethereum approvals are slow enough to deserve their own "Approving"
      // stage; elsewhere (and on Ledger) the approve is folded into the swap
      // pill. Hardware wallets always show the dedicated stage.
      toaster:
        isDeviceAccount(wallet) || inputChain === NetworkId.Ethereum
          ? toaster.approve
          : toaster.swap,
    });
  }

  const swapTx = configuredQuote.transactionSwap;
  const swapMultichain = swapTx ? toMultichainTransaction(swapTx) : null;
  const fallbackSwapAction = isCrossChain
    ? createBridgeAddressAction2({
        address,
        transaction: swapMultichain,
        hash: null,
        explorerUrl: null,
        spendFungible: inputFungible,
        spendAmount,
        receiveFungible: outputFungible,
        receiveAmount: quote.outputAmount,
        inputNetwork,
        outputNetwork,
        receiverAddress,
      })
    : createTradeAddressAction2({
        address,
        transaction: swapMultichain,
        hash: null,
        explorerUrl: null,
        spendFungible: inputFungible,
        spendAmount,
        receiveFungible: outputFungible,
        receiveAmount: quote.outputAmount,
        network: inputNetwork,
        rate: quote.rate,
      });

  const swapContext = {
    chain: inputChain,
    initiator: INTERNAL_ORIGIN,
    clientScope: clientScope.swap,
    actionType: actionType?.swap,
    feeValueCommon,
    addressAction: interpretationAction ?? fallbackSwapAction,
    warningWasShown,
    outputAmountColor,
  };

  if (swapMultichain) {
    // On-chain Swap: swap is step 0 only when there's no approve; honor
    // userNonce there. After an approve, strip and let prepareNonce resolve.
    steps.push({
      kind: 'send',
      params: {
        ...swapContext,
        transaction:
          !hasApproveStep && userNonce != null
            ? withNonce(swapMultichain, userNonce)
            : withoutNonce(swapMultichain),
        quote,
        outputChain,
      },
      toaster: toaster.swap,
    });
  } else {
    invariant(isIntentQuote(quote), 'Quote must carry a Swap Intent');
    steps.push({
      kind: 'order',
      params: {
        ...swapContext,
        quote,
        outputChain,
        // A mined On-chain Approval invalidates the intent: re-quote first
        requote: hasApproveStep
          ? {
              address,
              currency,
              formState: quotesFormState,
              providerId: quote.contractMetadata.id,
            }
          : null,
        order: {
          from: address,
          inputChain,
          outputChain,
          explorerUrlTemplate:
            quote.contractMetadata.explorer?.txUrl ??
            inputNetwork.explorer_tx_url ??
            null,
        },
      },
      toaster: toaster.swap,
    });
  }

  return steps;
}

/** The first step has been broadcast / placed: the form may reset */
export function isSentEvent(event: { type: string; index?: number }): boolean {
  return (
    (event.type === 'step-pending' || event.type === 'step-order-pending') &&
    event.index === 0
  );
}
