import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useStore } from '@store-unit/react';
import { RenderArea } from 'react-area';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { IncomingTransactionWithFrom } from 'src/modules/ethereum/types/IncomingTransaction';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import { isDeviceAccount } from 'src/shared/types/validators';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { HardwareSignMessage } from 'src/ui/pages/HardwareWalletConnection/HardwareSignMessage';
import type { SignMessageHandle } from 'src/ui/pages/HardwareWalletConnection/HardwareSignMessage';
import { NetworkFee } from 'src/ui/pages/SendTransaction/NetworkFee';
import { DEFAULT_CONFIGURATION } from 'src/ui/pages/SendTransaction/TransactionConfiguration/applyConfiguration';
import { AddressActionNetworkFee } from 'src/ui/pages/SendTransaction/TransactionConfiguration/TransactionConfiguration';
import { useTransactionFee } from 'src/ui/pages/SendTransaction/TransactionConfiguration/useTransactionFee';
import { TransactionWarnings } from 'src/ui/pages/SendTransaction/TransactionWarnings';
import { walletPort } from 'src/ui/shared/channels';
import { InterpretationSecurityCheck } from 'src/ui/shared/security-check';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { interpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { signDismissMessage, type DismissSigner } from './dismissPendingAction';
import {
  closePendingActionDialog,
  pendingActionDialogStore,
  type PendingActionDialogState,
} from './pendingActionDialogStore';
import type { PendingSignReviewRequest } from './signPendingAction';

type DialogOf<K extends PendingActionDialogState['kind']> = Extract<
  PendingActionDialogState,
  { kind: K }
>;

/** `HardwareSignMessage` maps a device-side rejection to this message */
function isDeniedOnDevice(error: unknown) {
  return error instanceof Error && error.message === 'Signature denied by user';
}

function PendingSignNetworkFee({
  transaction,
  chain,
  interpretation,
}: {
  transaction: IncomingTransactionWithFrom;
  chain: Chain;
  interpretation: InterpretResponse | null;
}) {
  const { data: chainGasPrices = null } = useGasPrices(chain, {
    suspense: true,
  });
  const transactionFee = useTransactionFee({
    address: transaction.from,
    transaction,
    chain,
    onFeeValueCommonReady: null,
    networkFeeConfiguration: null,
    chainGasPrices,
  });
  return (
    <NetworkFee
      transaction={transaction}
      transactionFee={transactionFee}
      chain={chain}
      chainGasPrices={chainGasPrices}
      networkFeeConfiguration={DEFAULT_CONFIGURATION.networkFee}
      label={<UIText kind="small/regular">Network Fee</UIText>}
      onChange={null}
      interpretation={interpretation}
    />
  );
}

function PendingSignReview({
  request: { item, transaction, chain: chainId, addressAction },
  onConfirm,
  onCancel,
}: {
  request: PendingSignReviewRequest;
  onConfirm(): void;
  onCancel(): void;
}) {
  const { currency } = useCurrency();
  const chain = useMemo(() => createChain(chainId), [chainId]);
  const { networks } = useNetworks([chainId]);
  const network = networks?.getNetworkByName(chain) ?? null;
  const interpretQuery = useQuery({
    queryKey: [
      'pendingSignReview/interpret',
      item.address,
      transaction,
      currency,
    ],
    queryFn: () =>
      interpretTxBasedOnEligibility({
        address: item.address,
        transactions: [transaction],
        eligibilityQueryData: false,
        eligibilityQueryStatus: 'success',
        currency,
        origin: INTERNAL_ORIGIN,
      }),
    suspense: false,
    useErrorBoundary: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });
  const interpretation = interpretQuery.data ?? null;
  const interpretedAction = interpretation?.data.action ?? null;
  const evmTransaction = transaction.evm
    ? { ...transaction.evm, from: transaction.evm.from || item.address }
    : null;
  const solanaFee = interpretedAction?.fee ?? item.fee;

  return (
    <VStack gap={16} style={{ padding: '0 16px 24px' }}>
      {network ? (
        <VStack
          gap={4}
          style={{
            ['--surface-background-color' as string]: 'var(--neutral-100)',
          }}
        >
          <AddressActionDetails
            address={item.address}
            addressAction={interpretedAction ?? addressAction}
            network={network}
            allowanceQuantityCommon={null}
            customAllowanceQuantityBase={null}
            showApplicationLine={true}
            singleAssetElementEnd={null}
          />
        </VStack>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CircleSpinner />
        </div>
      )}
      <InterpretationSecurityCheck
        interpretation={interpretation}
        interpretQuery={interpretQuery}
      />
      {evmTransaction && network ? (
        <ErrorBoundary renderError={() => null}>
          <React.Suspense fallback={null}>
            <TransactionWarnings
              address={item.address}
              addressAction={interpretedAction}
              transaction={evmTransaction}
              network={network}
              networkFeeConfiguration={DEFAULT_CONFIGURATION.networkFee}
              paymasterEligible={false}
            />
          </React.Suspense>
        </ErrorBoundary>
      ) : (
        <RenderArea name="transaction-warning-section" />
      )}
      {evmTransaction ? (
        <ErrorBoundary
          renderError={() => (
            <UIText kind="small/regular" color="var(--neutral-500)">
              Failed to load network fee
            </UIText>
          )}
        >
          <React.Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'end' }}>
                <CircleSpinner />
              </div>
            }
          >
            <PendingSignNetworkFee
              transaction={evmTransaction}
              chain={chain}
              interpretation={interpretation}
            />
          </React.Suspense>
        </ErrorBoundary>
      ) : solanaFee ? (
        <AddressActionNetworkFee
          fee={solanaFee}
          isLoading={interpretQuery.isInitialLoading}
        />
      ) : null}
      <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button kind="regular" onClick={onCancel}>
          Cancel
        </Button>
        <Button kind="primary" onClick={onConfirm}>
          Confirm
        </Button>
      </HStack>
    </VStack>
  );
}

function DismissConfirm({
  dialog: { item, message, wallet, resolve, reject },
}: {
  dialog: DialogOf<'dismiss'>;
}) {
  const { globalPreferences } = useGlobalPreferences();
  const hardwareSignRef = useRef<SignMessageHandle | null>(null);
  const ledgerWallet = isDeviceAccount(wallet) ? wallet : null;
  const ecosystem = getAddressType(item.address);

  const signMutation = useMutation({
    mutationFn: () => {
      const signer: DismissSigner = ledgerWallet
        ? {
            kind: 'ledger',
            ecosystem,
            personalSign: (value) => {
              const handle = hardwareSignRef.current;
              if (!handle) {
                throw new Error('HardwareSignMessage must be mounted');
              }
              return handle.personalSign(value);
            },
            solana_signMessage: (messageHex) => {
              const handle = hardwareSignRef.current;
              if (!handle) {
                throw new Error('HardwareSignMessage must be mounted');
              }
              return handle.solana_signMessage(messageHex);
            },
          }
        : {
            kind: 'software',
            ecosystem,
            signMessage: (params) => walletPort.request('signMessage', params),
            solanaSignMessageWithAddress: (params) =>
              walletPort.request('solana_signMessageWithAddress', params),
          };
      return signDismissMessage({
        signer,
        address: item.address,
        message,
        messageContextParams: {
          initiator: INTERNAL_ORIGIN,
          clientScope: 'History',
        },
      });
    },
    onSuccess: (signature) => resolve(signature),
    onError: (error) =>
      isDeniedOnDevice(error) ? resolve(null) : reject(error),
  });

  return (
    <VStack gap={16} style={{ padding: '0 16px 24px' }}>
      <UIText kind="body/regular" color="var(--neutral-700)">
        {item.type.displayValue} will be removed from your pending transactions.
        You will sign a message, which sends no transaction and costs no fee.
      </UIText>
      {ledgerWallet ? (
        <HardwareSignMessage
          ref={hardwareSignRef}
          derivationPath={ledgerWallet.derivationPath}
          ecosystem={ecosystem}
          isSigning={signMutation.isLoading}
          buttonTitle="Hide with Ledger"
          bluetoothSupportEnabled={Boolean(
            globalPreferences?.bluetoothSupportEnabled
          )}
          keyboardShortcutEnabled={false}
          showSigningSettings={false}
          onClick={() => signMutation.mutate()}
        />
      ) : (
        <Button
          kind="primary"
          disabled={signMutation.isLoading}
          onClick={() => signMutation.mutate()}
        >
          {signMutation.isLoading ? 'Signing…' : 'Hide'}
        </Button>
      )}
      <Button kind="regular" onClick={() => resolve(null)}>
        Cancel
      </Button>
    </VStack>
  );
}

/** App-level host of the review, dismiss and error dialogs the History Sign and Dismiss flows open */
export function PendingActionDialogs() {
  const dialog = useStore(pendingActionDialogStore);
  const [lastDialog, setLastDialog] = useState(dialog);
  useEffect(() => {
    if (dialog) {
      setLastDialog(dialog);
    }
  }, [dialog]);
  const current = dialog ?? lastDialog;

  return (
    <>
      <Dialog2
        open={dialog?.kind === 'review'}
        onClose={() =>
          dialog?.kind === 'review' ? dialog.resolve(false) : null
        }
        title="Review Transaction"
        size="content"
        autoFocusInput={false}
      >
        {current?.kind === 'review' ? (
          <PendingSignReview
            request={current.request}
            onConfirm={() => current.resolve(true)}
            onCancel={() => current.resolve(false)}
          />
        ) : null}
      </Dialog2>
      <Dialog2
        open={dialog?.kind === 'dismiss'}
        onClose={() =>
          dialog?.kind === 'dismiss' ? dialog.resolve(null) : null
        }
        title="Hide Transaction"
        size="content"
        autoFocusInput={false}
      >
        {current?.kind === 'dismiss' ? (
          <DismissConfirm dialog={current} />
        ) : null}
      </Dialog2>
      <Dialog2
        open={dialog?.kind === 'error'}
        onClose={closePendingActionDialog}
        title={current?.kind === 'error' ? current.title : undefined}
        size="content"
        autoFocusInput={false}
      >
        {current?.kind === 'error' ? (
          <VStack gap={16} style={{ padding: '0 16px 24px' }}>
            <UIText
              kind="small/regular"
              color="var(--negative-500)"
              style={{ overflowWrap: 'anywhere' }}
            >
              {current.message}
            </UIText>
            <Button kind="regular" onClick={closePendingActionDialog}>
              Close
            </Button>
          </VStack>
        ) : null}
      </Dialog2>
    </>
  );
}
