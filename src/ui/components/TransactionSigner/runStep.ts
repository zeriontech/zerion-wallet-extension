import { walletPort } from 'src/ui/shared/channels';
import { emitter } from 'src/ui/shared/events';
import { invariant } from 'src/shared/invariant';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { waitForTransactionResolve } from 'src/ui/transactions/useLocalTransactionStatus';
import { isDeviceAccount } from 'src/shared/types/validators';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import {
  prepareForSignByLedger,
  signRegularOrPaymasterTx,
  signSolanaTransaction,
} from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction/HardwareSignTransaction';
import { hardwareMessageHandler } from 'src/ui/pages/HardwareWalletConnection/shared/messageHandler';
import { getLedgerIframeController } from 'src/ui/hardware-wallet/useLedgerIframeController';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { signIntent } from 'src/ui/shared/forms/trading/signIntent';
import { TransactionFailedOnChainError } from './errors';
import { emitQueueEvent, type QueueRecord } from './store';
import { runOrderStep } from './runOrderStep';
import type { RunStep } from './runQueue';
import type { OrderStepParams, SendTxParams } from './types';

async function signSendStepSoftware({
  params: { transaction, ...txContext },
}: {
  params: SendTxParams;
}): Promise<SignTransactionResult> {
  // EVM and Solana software-wallet paths copied from
  // src/ui/components/SignTransactionButton/SignTransactionButton.tsx
  if (transaction.evm) {
    const result = await walletPort.request('signAndSendTransaction', [
      transaction.evm,
      txContext,
    ]);
    return { evm: result };
  }
  const methodMap = {
    default: 'solana_signAndSendTransaction',
    signAndSendTransaction: 'solana_signAndSendTransaction',
    signTransaction: 'solana_signTransaction',
  } as const;
  invariant(
    txContext.method !== 'signAllTransactions',
    'TransactionSigner: Use kind: "signAll" for signAllTransactions'
  );
  const methodName = txContext.method
    ? methodMap[txContext.method]
    : methodMap.default;
  const result = await walletPort.request(methodName, {
    transaction: transaction.solana,
    params: txContext,
  });
  return { solana: result };
}

async function signSendStepHardware({
  queue,
  params: { transaction, ...txContext },
}: {
  queue: QueueRecord;
  params: SendTxParams;
}): Promise<SignTransactionResult> {
  const wallet = queue.options.wallet;
  invariant(
    isDeviceAccount(wallet),
    'signSendStepHardware: wallet must be a DeviceAccount'
  );

  if (transaction.evm) {
    const networksStore = await getNetworksStore();
    const network = await networksStore.fetchNetworkById(txContext.chain);
    const txForLedger = await prepareForSignByLedger({
      transaction: transaction.evm,
      address: wallet.address,
      network,
    });
    const normalizedTransaction = prepareTransaction(txForLedger);
    const controller = getLedgerIframeController();
    invariant(controller, 'Ledger iframe controller not mounted');
    const contentWindow = controller.getContentWindow();
    invariant(contentWindow, 'Ledger iframe contentWindow not available');
    const signed = await signRegularOrPaymasterTx({
      transaction: normalizedTransaction,
      messageHandler: hardwareMessageHandler,
      derivationPath: wallet.derivationPath,
      contentWindow,
    });
    const result = await walletPort.request('sendSignedTransaction', {
      serialized: signed.serialized,
      txContext,
    });
    return { evm: result };
  }

  invariant(
    txContext.method !== 'signAllTransactions',
    'TransactionSigner: signAllTransactions is not supported for hardware wallets'
  );
  const controller = getLedgerIframeController();
  invariant(controller, 'Ledger iframe controller not mounted');
  const contentWindow = controller.getContentWindow();
  invariant(contentWindow, 'Ledger iframe contentWindow not available');
  const signed = await signSolanaTransaction({
    transaction: transaction.solana,
    messageHandler: hardwareMessageHandler,
    derivationPath: wallet.derivationPath,
    contentWindow,
  });
  const result = await walletPort.request('solana_sendTransaction', {
    signed: signed as StringBase64,
    publicKey: wallet.address,
    params: txContext,
  });
  return { solana: result };
}

function runOrderStepInQueue({
  queue,
  params,
  index,
}: {
  queue: QueueRecord;
  params: OrderStepParams;
  index: number;
}) {
  const { wallet } = queue.options;
  return runOrderStep({
    params,
    index,
    deps: {
      signIntent: (intent) => signIntent({ wallet, intent }),
      executeOrder: async (payload) => {
        const response = await ZerionAPI.transactionExecuteOrder(payload);
        return { orderId: response.data?.orderId };
      },
      reportOrderPlaced: (report) =>
        walletPort.request('uiReportOrderPlaced', report),
      reportExecuteOrderFailure: (failure) =>
        emitter.emit('executeOrderFailed', failure),
      emit: (event) => emitQueueEvent(queue.queueId, event),
      address: wallet.address,
      nowSeconds: () => Math.floor(Date.now() / 1000),
      signal: queue.abortController.signal,
    },
  });
}

export const runStep: RunStep = async ({ queue, step, index }) => {
  if (step.kind === 'order') {
    return runOrderStepInQueue({ queue, params: step.params, index });
  }
  const isHardware = isDeviceAccount(queue.options.wallet);

  emitQueueEvent(queue.queueId, { type: 'step-signing', index });

  let result: SignTransactionResult | null = null;
  if (step.kind === 'send') {
    result = isHardware
      ? await signSendStepHardware({ queue, params: step.params })
      : await signSendStepSoftware({ params: step.params });
  }
  invariant(result, 'Step result is unexpectedly null');

  const txHash =
    result.evm?.hash ||
    (Array.isArray(result.solana)
      ? result.solana[0].signature
      : result.solana?.signature);
  if (txHash) {
    emitQueueEvent(queue.queueId, {
      type: 'step-pending',
      index,
      txHash,
    });
    const status = await waitForTransactionResolve(txHash);
    if (status === 'failed' || status === 'dropped') {
      throw new TransactionFailedOnChainError(status, txHash);
    }
  }
  return result;
};
