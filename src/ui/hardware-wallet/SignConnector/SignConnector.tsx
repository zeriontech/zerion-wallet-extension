import React, { useCallback, useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type {
  TransportIdentifier,
  UserInteractionRequested,
} from '@zeriontech/hardware-wallet-connection';
import {
  checkDevice,
  signTransaction,
  personalSign,
  signSolanaTransaction,
  signTypedData_v4,
  connectDevice,
  transports,
  parseLedgerError,
  getDeniedByUserError,
  unsubscribeCheckDeviceListeners,
  solanaSignMessage,
} from '@zeriontech/hardware-wallet-connection';
import ConnectionOnIcon from 'jsx:src/ui/assets/connection-toggle-on.svg';
import ConnectionOffIcon from 'jsx:src/ui/assets/connection-toggle-off.svg';
import DisconnectIcon from 'jsx:src/ui/assets/disconnect.svg';
import type { RpcRequest } from 'src/shared/custom-rpc';
import {
  isRpcRequest,
  isRpcResponse,
  isRpcResult,
} from 'src/shared/custom-rpc';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import { createNanoEvents } from 'nanoevents';
import {
  solFromBase64,
  solToBase64,
} from 'src/modules/solana/transactions/create';
import { uint8ArrayToBase64 } from 'src/modules/crypto';
import { Transaction } from '@solana/web3.js';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { InteractionRequested } from '../InterationRequested/InteractionRequested';
import {
  assertPersonalSignParams,
  assertSignSolanaTransactionParams,
  assertSignTransactionParams,
  assertSignTypedData_v4Params,
} from './helpers';

const DEVICE_CONNECTION_TIMEOUT = 500;
async function getConnectedSessionId({
  transport = transports.hid,
}: {
  transport?: TransportIdentifier;
}) {
  return Promise.race([
    rejectAfterDelay(DEVICE_CONNECTION_TIMEOUT, 'Device not connected').catch(
      () => {
        unsubscribeCheckDeviceListeners();
        return null;
      }
    ),
    checkDevice({ transportIdentifier: transport })
      .then(({ sessionId }) => sessionId)
      .catch(() => {
        unsubscribeCheckDeviceListeners();
        return null;
      }),
  ]);
}

type HardwareRPCRequest = Omit<RpcRequest, 'id'> & {
  id?: string;
  transport?: TransportIdentifier;
  sessionId?: string;
};

function isHardwareRpcRequest(
  payload: Partial<RpcRequest> | unknown
): payload is HardwareRPCRequest {
  return isRpcRequest(payload);
}

export class DeviceController {
  private emitter = createNanoEvents<{
    message: (msg: unknown) => void;
  }>();

  private onNotConnected?: (message: HardwareRPCRequest) => void;
  private onInteractionRequested?: (type: UserInteractionRequested) => void;
  private onError?: (error: unknown) => void;
  private cancelLedgerRequest?: () => void;
  private lastRequestId: string | null = null;

  static signTransaction =
    (params: unknown) =>
    (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertSignTransactionParams(params);
      return signTransaction(
        {
          derivationPath: params.derivationPath,
          rawTransaction: params.transaction,
        },
        { sessionId, onInteractionRequested }
      );
    };

  static solana_signTransaction =
    (params: unknown) =>
    (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertSignSolanaTransactionParams(params);

      /**
       * Solana transactions in Ledger require only the message data without signatures
       * In @solana/web3.js we expect signatures to be prefilled with placeholders.
       * So we need to clean the transaction before sending it to Ledger.
       * And after receiving the signature, we need to reattach it to the transaction.
       */
      const transaction = solFromBase64(params.transaction);
      const cleanedTransaction =
        transaction instanceof Transaction
          ? uint8ArrayToBase64(transaction.serializeMessage())
          : uint8ArrayToBase64(transaction.message.serialize());

      const { promise, cancel } = signSolanaTransaction(
        {
          derivationPath: params.derivationPath,
          transaction: cleanedTransaction,
        },
        { sessionId, onInteractionRequested }
      );

      return {
        promise: promise.then(({ signature }) => {
          if (transaction instanceof Transaction) {
            transaction.signatures = [
              {
                publicKey: transaction.feePayer!,
                signature: Buffer.from(signature),
              },
            ];
          } else {
            transaction.signatures[0] = signature;
          }
          return solToBase64(transaction);
        }),
        cancel,
      };
    };

  static personalSign =
    (params: unknown) =>
    (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertPersonalSignParams(params);
      const message = toUtf8String(params.message);
      return personalSign(
        { derivationPath: params.derivationPath, message },
        { sessionId, onInteractionRequested }
      );
    };

  static signTypedData_v4 =
    (params: unknown) =>
    (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertSignTypedData_v4Params(params);
      return signTypedData_v4(
        {
          derivationPath: params.derivationPath,
          rawTypedData: params.typedData,
        },
        { sessionId, onInteractionRequested }
      );
    };

  static solana_signMessage =
    (params: unknown) =>
    (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertPersonalSignParams(params);
      const message = toUtf8String(params.message);
      return solanaSignMessage(
        { derivationPath: params.derivationPath, message },
        { sessionId, onInteractionRequested }
      );
    };

  listener = async (event: MessageEvent) => {
    if (isHardwareRpcRequest(event.data)) {
      const { id, method, params, transport = transports.hid } = event.data;
      this.lastRequestId = id || null;
      if (
        isClassProperty(DeviceController, method) &&
        typeof DeviceController[method] === 'function'
      ) {
        try {
          let sessionId = event.data.sessionId || null;
          if (!sessionId) {
            sessionId = await getConnectedSessionId({ transport });
          }
          if (!sessionId) {
            this.onNotConnected?.(event.data);
            return;
          }
          const { promise, cancel } = DeviceController[method](params)(
            // @ts-ignore Controller[method] should be callable here
            sessionId,
            this.onInteractionRequested
          );
          this.cancelLedgerRequest = cancel;
          const result = await promise;
          window.parent.postMessage({ id, result }, window.location.origin);
        } catch (error) {
          this.onError?.(error);
          window.parent.postMessage(
            { id, error: parseLedgerError(error).toString() },
            window.location.origin
          );
        } finally {
          this.lastRequestId = null;
        }
      }
    }
    this.emitter.emit('message', event.data);
  };

  request({
    method,
    params,
    id: maybeId,
  }: Omit<RpcRequest, 'id'> & { id?: string }) {
    const id = maybeId ?? nanoid();
    window.parent.postMessage({ id, method, params }, window.location.origin);
    return new Promise((resolve, reject) => {
      const unlisten = this.emitter.on('message', (msg: unknown) => {
        if (isRpcResponse(msg)) {
          if (msg.id === id) {
            if (isRpcResult(msg)) {
              resolve(msg.result);
            } else {
              reject(msg.error);
            }
            unlisten();
          }
        }
      });
    });
  }

  listen({
    onNotConnected,
    onInteractionRequested,
    onError,
  }: {
    onNotConnected?: (message: HardwareRPCRequest) => void;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
    onError?: (error: unknown) => void;
  } = {}) {
    this.onNotConnected = onNotConnected;
    this.onInteractionRequested = onInteractionRequested;
    this.onError = onError;
    window.addEventListener('message', this.listener);
    return () => {
      window.removeEventListener('message', this.listener);
    };
  }

  cancel() {
    this.cancelLedgerRequest?.();
    this.request({ method: 'ledger/sign/cancel' });
    this.cancelLedgerRequest = undefined;
    const lastRequestId = this.lastRequestId;
    this.lastRequestId = null;
    return lastRequestId;
  }
}

export function SignConnector() {
  /**
   * If device is not connected, we store the interrupted request here
   * and show the connection options UI.
   * So we can retry it directly from this component;
   *
   * We also need to show connection buttons directly insie the IFrame,
   * because connect flow should be triggered by user interaction (click),
   * and the parent window can't do it.
   */
  const [interruptedRequest, setInterruptedRequest] =
    useState<HardwareRPCRequest | null>(null);
  const [interactionRequested, setInteractionRequested] =
    useState<UserInteractionRequested | null>(null);
  const [controller] = useState(() => new DeviceController());
  useEffect(() => {
    return controller.listen({
      onNotConnected: (request) => {
        setInterruptedRequest(request);
        controller.request({ method: 'ledger/sign/notConnected', params: {} });
      },
      onInteractionRequested: (type) => {
        if (type === 'none') {
          return;
        }
        setInteractionRequested(type);
        controller.request({
          method: 'ledger/sign/interactionRequested',
          params: { type },
        });
      },
      onError: () => {
        controller.cancel();
        controller.request({ method: 'ledger/sign/error' });
        setInterruptedRequest(null);
        setInteractionRequested(null);
      },
    });
  }, [controller]);

  const interruptRequest = useCallback(() => {
    const requestId = controller.cancel() || interruptedRequest?.id;
    if (requestId) {
      window.parent.postMessage(
        {
          id: requestId,
          error: getDeniedByUserError().toString(),
        },
        window.location.origin
      );
    }
    setInterruptedRequest(null);
    setInteractionRequested(null);
  }, [controller, interruptedRequest]);

  const [params] = useSearchParams();
  const ecosystem = (params.get('ecosystem') as BlockchainType) || 'evm';
  const windowType = params.get('windowType') || 'popup';
  const supportBluetooth = params.get('supportBluetooth') === 'true';

  const { mutate, isLoading } = useMutation({
    mutationFn: async (transport: TransportIdentifier) => {
      const { sessionId } = await connectDevice({
        transportIdentifier: transport,
      });
      return { sessionId, transport };
    },
    onSettled: () => {
      setInterruptedRequest(null);
      setInteractionRequested(null);
    },
    onError: (error) => {
      window.parent.postMessage(
        {
          id: interruptedRequest?.id,
          error: parseLedgerError(error).toString(),
        },
        window.location.origin
      );
      controller.request({ method: 'ledger/sign/error' });
    },
    onSuccess: ({ sessionId, transport }) => {
      controller.request({ method: 'ledger/sign/success', params: {} });
      window.postMessage({ ...interruptedRequest, transport, sessionId });
    },
  });

  return interruptedRequest ? (
    !isLoading ? (
      windowType === 'tab' ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 300,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <UIText kind="body/accent" style={{ textAlign: 'center' }}>
              Select how your device is connected
            </UIText>
            <ConnectionOnIcon
              style={{
                height: 60,
                width: 60,
                display: 'block',
                alignSelf: 'center',
              }}
            />
            <VStack gap={8}>
              <Button onClick={() => mutate(transports.hid)}>
                Sign via USB
              </Button>
              {supportBluetooth ? (
                <Button onClick={() => mutate(transports.bluetooth)}>
                  Sign via Bluetooth
                </Button>
              ) : null}
              <Button onClick={interruptRequest} kind="danger">
                Cancel
              </Button>
            </VStack>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 300,
          }}
        >
          <UIText kind="body/accent" style={{ textAlign: 'center' }}>
            No connected device found.
          </UIText>
          {supportBluetooth ? (
            <>
              <ConnectionOffIcon
                style={{
                  height: 80,
                  width: 80,
                  display: 'block',
                  alignSelf: 'center',
                  color: 'var(--notice-500)',
                }}
              />
              <VStack gap={8}>
                <Button
                  onClick={() => {
                    interruptRequest();
                    controller.request({
                      method: 'ledger/sign/openInTab',
                      params: {},
                    });
                  }}
                >
                  Open in new tab to connect via Bluetooth
                </Button>
                <Button
                  onClick={() => {
                    window.postMessage(interruptedRequest);
                    setInterruptedRequest(null);
                    controller.request({
                      method: 'ledger/sign/resume',
                      params: {},
                    });
                  }}
                >
                  Try Again
                </Button>
                <Button onClick={interruptRequest} kind="danger">
                  Cancel
                </Button>
              </VStack>
            </>
          ) : (
            <>
              <DisconnectIcon
                style={{
                  height: 80,
                  width: 80,
                  display: 'block',
                  alignSelf: 'center',
                  color: 'var(--negative-500)',
                }}
              />
              <VStack gap={8}>
                <Button
                  onClick={() => {
                    window.postMessage(interruptedRequest);
                    setInterruptedRequest(null);
                    controller.request({
                      method: 'ledger/sign/resume',
                      params: {},
                    });
                  }}
                >
                  Try Again
                </Button>
                <Button onClick={interruptRequest} kind="danger">
                  Cancel
                </Button>
              </VStack>
            </>
          )}
        </div>
      )
    ) : (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: 300,
        }}
      >
        <HStack
          gap={8}
          style={{ padding: 24, width: '100%' }}
          justifyContent="center"
        >
          <CircleSpinner color="var(--primary)" size="24px" />
          <UIText kind="body/accent">Connecting...</UIText>
        </HStack>
      </div>
    )
  ) : interactionRequested && interactionRequested !== 'none' ? (
    <VStack
      style={{
        justifyContent: 'space-between',
        height: 300,
        width: '100%',
        gridTemplateRows: '1fr auto',
        gridTemplateColumns: '1fr',
        placeItems: 'center',
      }}
      gap={4}
    >
      <InteractionRequested kind={interactionRequested} ecosystem={ecosystem} />
      <Button
        onClick={interruptRequest}
        kind="regular"
        style={{ width: '100%' }}
      >
        Cancel
      </Button>
    </VStack>
  ) : null;
}
