import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ethers } from 'ethers';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { nanoid } from 'nanoid';
import type { SignTransactionResult } from 'src/ui/hardware-wallet/types';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { HStack } from 'src/ui/ui-kit/HStack';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import type { Chain } from 'src/modules/networks/Chain';
import { Networks } from 'src/modules/networks/Networks';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { TextPulse } from 'src/ui/components/TextPulse';
import {
  createTypedData,
  serializePaymasterTx,
} from 'src/modules/ethereum/account-abstraction/createTypedData';
import omit from 'lodash/omit';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { isRpcRequest } from 'src/shared/custom-rpc';
import type { LedgerError } from '@zeriontech/hardware-wallet-connection';
import {
  deniedByUser,
  parseLedgerError,
} from '@zeriontech/hardware-wallet-connection';
import { isObj } from 'src/shared/isObj';
import { TroubleshootingDialog } from 'src/ui/hardware-wallet/TroubleshootingDialog';
import { openUrl } from 'src/ui/shared/openUrl';
import { urlContext } from 'src/shared/UrlContext';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { isAllowedMessage } from '../shared/isAllowedMessage';
import { hardwareMessageHandler } from '../shared/messageHandler';

async function signRegularOrPaymasterTx({
  messageHandler,
  transaction: incomingTx,
  derivationPath,
  contentWindow,
}: {
  messageHandler: typeof hardwareMessageHandler;
  transaction: IncomingTransaction;
  derivationPath: string;
  contentWindow: Window;
}): Promise<SignTransactionResult> {
  const paymasterEligible = Boolean(incomingTx.customData?.paymasterParams);
  const transaction = prepareTransaction(incomingTx);
  if (paymasterEligible) {
    const eip712Tx = omit(transaction, ['authorizationList']);
    const typedData = createTypedData(eip712Tx);

    const ledgerSignature = await messageHandler.request<string>(
      {
        id: nanoid(),
        method: 'signTypedData_v4',
        params: { derivationPath, typedData },
      },
      contentWindow
    );
    /**
     * Ethereum signature's `v` value can either be in range [0, 1] or [27, 28]
     * Both signatures can be valid, so this historically allowed for double spends.
     * Some systems decided to check this and accept only one kind.
     * Currently our own ledger adapter code subtracts 27 (to conform to some dapp's expectations),
     * but zkSync stack seems to expect [27, 28]
     * Therefore we add this number for this particular case
     */
    const s = ethers.Signature.from(ledgerSignature);
    if ((s.v as number) === 0 || (s.v as number) === 1) {
      s.v += 27;
    }
    const signature = ethers.Signature.from(s).serialized;
    const rawTransaction = serializePaymasterTx({
      transaction: eip712Tx,
      signature,
    });
    return { serialized: rawTransaction };
  } else {
    return await messageHandler.request<SignTransactionResult>(
      {
        id: nanoid(),
        method: 'signTransaction',
        params: { derivationPath, transaction },
      },
      contentWindow
    );
  }
}

async function signSolanaTransaction({
  messageHandler,
  transaction,
  derivationPath,
  contentWindow,
}: {
  messageHandler: typeof hardwareMessageHandler;
  transaction: StringBase64;
  derivationPath: string;
  contentWindow: Window;
}): Promise<StringBase64> {
  return await messageHandler.request<StringBase64>(
    {
      id: nanoid(),
      method: 'solana_signTransaction',
      params: { derivationPath, transaction },
    },
    contentWindow
  );
}

interface SignTransactionParams {
  transaction: IncomingTransaction;
  address: string;
  chain: Chain;
}

interface SolanaSignTransactionParams {
  transaction: StringBase64; // base64
  address: string;
}

export interface SignTransactionHandle {
  signTransaction: ({
    transaction,
    address,
    chain,
  }: SignTransactionParams) => Promise<string>;
  solana_signTransaction: ({
    transaction,
    address,
  }: SolanaSignTransactionParams) => Promise<string>;
}

async function prepareForSignByLedger({
  transaction,
  address,
  network,
}: {
  transaction: IncomingTransaction;
  address: string;
  network: NetworkConfig;
}) {
  const value = { ...transaction };
  if (value.nonce == null) {
    const { value: nonce } = await uiGetBestKnownTransactionCount({
      address,
      network,
      defaultBlock: 'pending',
    });
    value.nonce = nonce;
  }
  if (!value.chainId) {
    const chainId = Networks.getChainId(network);
    invariant(chainId, 'Unable to find chainId for transaction');
    value.chainId = chainId;
  }
  return value;
}

export const HardwareSignTransaction = React.forwardRef(
  function HardwareSignTransaction(
    {
      ecosystem,
      derivationPath,
      isSending,
      children,
      buttonTitle,
      buttonKind = 'primary',
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      ecosystem: BlockchainType;
      derivationPath: string;
      isSending: boolean;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
    },
    ref: React.Ref<SignTransactionHandle>
  ) {
    const { globalPreferences } = useGlobalPreferences();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

    const { mutateAsync: signTransaction, ...signMutation } = useMutation({
      mutationFn: async ({
        transaction,
        address,
        chain,
      }: SignTransactionParams): Promise<string> => {
        const networksStore = await getNetworksStore();
        const network = await networksStore.fetchNetworkById(chain.toString());
        const txForLedger = await prepareForSignByLedger({
          transaction,
          address,
          network,
        });
        const normalizedTransaction = prepareTransaction(txForLedger);
        invariant(iframeRef.current, 'Ledger iframe not found');
        invariant(
          iframeRef.current.contentWindow,
          'Iframe contentWindow is not available'
        );
        try {
          const result = await signRegularOrPaymasterTx({
            transaction: normalizedTransaction,
            messageHandler: hardwareMessageHandler,
            derivationPath,
            contentWindow: iframeRef.current.contentWindow,
          });
          return result.serialized;
        } catch (error) {
          const normalizedError = parseLedgerError(error);
          if (deniedByUser(normalizedError)) {
            throw new Error('Signature denied by user');
          }
          throw normalizedError;
        }
      },
    });

    const { mutateAsync: solana_signTransaction, ...signSolanaMutation } =
      useMutation({
        mutationFn: async ({
          transaction,
        }: SolanaSignTransactionParams): Promise<string> => {
          invariant(iframeRef.current, 'Ledger iframe not found');
          invariant(
            iframeRef.current.contentWindow,
            'Iframe contentWindow is not available'
          );
          try {
            const result = await signSolanaTransaction({
              transaction,
              messageHandler: hardwareMessageHandler,
              derivationPath,
              contentWindow: iframeRef.current.contentWindow,
            });
            return result;
          } catch (error) {
            const normalizedError = parseLedgerError(error);
            if (deniedByUser(normalizedError)) {
              throw new Error('Signature denied by user');
            }
            throw normalizedError;
          }
        },
      });

    const [signError, setSignError] = useState<LedgerError | null>(null);

    useEffect(() => {
      async function handler(event: MessageEvent) {
        invariant(iframeRef.current, 'Iframe should be mounted');
        if (!isAllowedMessage(event, iframeRef.current)) {
          return;
        }
        if (isRpcRequest(event.data)) {
          const { method, params } = event.data;
          if (
            method === 'ledger/sign/success' ||
            method === 'ledger/sign/resume'
          ) {
            dialogRef.current?.close();
            setSignError(null);
          } else if (method === 'ledger/sign/error') {
            dialogRef.current?.close();
            setSignError(
              isObj(params) && 'error' in params
                ? parseLedgerError(params.error)
                : null
            );
          } else if (
            method === 'ledger/sign/notConnected' ||
            method === 'ledger/sign/interactionRequested'
          ) {
            dialogRef.current?.showModal();
          } else if (method === 'ledger/sign/openInTab') {
            const url = new URL(window.location.href);
            openUrl(url, { windowType: 'tab' });
            setSignError(null);
          }
        }
      }
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, []);

    const isError = signMutation.isError || signSolanaMutation.isError;
    useEffect(() => {
      if (isError) {
        dialogRef.current?.close();
      }
    }, [isError]);

    useImperativeHandle(ref, () => ({
      signTransaction,
      solana_signTransaction,
    }));

    return (
      <>
        <BottomSheetDialog
          ref={dialogRef}
          closeOnClickOutside={false}
          height="fit-content"
        >
          {globalPreferences ? (
            <LedgerIframe
              ref={iframeRef}
              initialRoute="/signConnector"
              appSearchParams={new URLSearchParams({
                ecosystem,
                windowType: urlContext.windowType,
                supportBluetooth: `${Boolean(
                  globalPreferences.bluetoothSupportEnabled
                )}`,
              }).toString()}
              style={{
                // border: 'none',
                backgroundColor: 'transparent',
              }}
              // @ts-ignore
              allowtransparency="true"
              tabIndex={-1}
              height={300}
            />
          ) : null}
        </BottomSheetDialog>
        <VStack gap={8}>
          {signMutation.isLoading || signSolanaMutation.isLoading ? (
            <Button
              kind="loading-border"
              disabled={true}
              title="Follow instructions on your ledger device"
            >
              <TextPulse>Sign on Device</TextPulse>
            </Button>
          ) : (
            <Button
              kind={buttonKind}
              disabled={
                signMutation.isLoading ||
                signSolanaMutation.isLoading ||
                isSending
              }
              style={{
                paddingInline: 16, // fit longer button label
              }}
              {...buttonProps}
            >
              <HStack gap={8} alignItems="center" justifyContent="center">
                <LedgerIcon />
                {children || // all this will definitely be refactored soon
                  (isSending ? 'Sending' : buttonTitle || 'Sign with Ledger')}
              </HStack>
            </Button>
          )}
          {signError ? <TroubleshootingDialog error={signError} /> : null}
        </VStack>
      </>
    );
  }
);
