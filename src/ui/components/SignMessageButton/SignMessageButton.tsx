import { useMutation } from '@tanstack/react-query';
import React, { useImperativeHandle, useRef } from 'react';
import { invariant } from 'src/shared/invariant';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { MessageContextParams } from 'src/shared/types/SignatureContextParams';
import { isDeviceAccount } from 'src/shared/types/validators';
import type { SignMessageHandle } from 'src/ui/pages/HardwareWalletConnection/HardwareSignMessage';
import { HardwareSignMessage } from 'src/ui/pages/HardwareWalletConnection/HardwareSignMessage';
import { walletPort } from 'src/ui/shared/channels';
import {
  Button,
  HoldableButton,
  type Kind as ButtonKind,
} from 'src/ui/ui-kit/Button';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { HStack } from 'src/ui/ui-kit/HStack';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { WithReadonlyWarningDialog } from '../SignTransactionButton/ReadonlyWarningDialog';

type PersonalSignParams = MessageContextParams & {
  params: [string];
};

type SignTypedDataParams = MessageContextParams & {
  typedData: string | TypedData;
};

type SolanaSignMessageParams = MessageContextParams & {
  messageHex: string;
};

export interface SignMsgBtnHandle {
  /** Solana signMessage */
  signMessage(params: SolanaSignMessageParams): Promise<string>;
  /** Ethereum personalSign */
  personalSign(params: PersonalSignParams): Promise<string>;
  signTypedData_v4: (params: SignTypedDataParams) => Promise<string>;
}

export const SignMessageButton = React.forwardRef(function SignMessageButton(
  {
    wallet,
    children,
    buttonTitle,
    buttonKind = 'primary',
    onClick,
    holdToSign,
    bluetoothSupportEnabled,
    ...buttonProps
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    wallet: ExternallyOwnedAccount;
    buttonTitle?: React.ReactNode;
    buttonKind?: ButtonKind;
    holdToSign: boolean | null;
    bluetoothSupportEnabled: boolean | null;
  },
  ref: React.Ref<SignMsgBtnHandle>
) {
  const hardwareSignRef = useRef<SignMessageHandle | null>(null);

  const personalSignMutation = useMutation({
    mutationFn: async (params: PersonalSignParams) => {
      if (isDeviceAccount(wallet)) {
        const { params: methodParams, ...messageContextParams } = params;
        const [message] = methodParams;
        invariant(
          hardwareSignRef.current,
          'HardwareSignMessage must be mounted'
        );
        const signature = await hardwareSignRef.current.personalSign(message);
        walletPort.request('registerPersonalSign', {
          message,
          address: wallet.address,
          ...messageContextParams,
        });
        return signature;
      } else {
        return await walletPort.request('personalSign', params);
      }
    },
  });

  const signTypedData_v4Mutation = useMutation({
    mutationFn: async (params: SignTypedDataParams) => {
      const { typedData, ...typedDataContext } = params;
      if (isDeviceAccount(wallet)) {
        invariant(
          hardwareSignRef.current,
          'HardwareSignMessage must be mounted'
        );
        const signature = await hardwareSignRef.current.signTypedData_v4(
          typedData
        );
        walletPort.request('registerTypedDataSign', {
          typedData,
          address: wallet.address,
          ...typedDataContext,
        });
        return signature;
      } else {
        return await walletPort.request('signTypedData_v4', {
          typedData,
          typedDataContext,
        });
      }
    },
  });

  const solanaSignMutation = useMutation({
    mutationFn: async (params: SolanaSignMessageParams) => {
      if (isDeviceAccount(wallet)) {
        invariant(
          hardwareSignRef.current,
          'HardwareSignMessage must be mounted'
        );
        const { messageHex: message } = params;
        const signature = await hardwareSignRef.current.solana_signMessage(
          message
        );
        return signature;
      } else {
        const result = await walletPort.request('solana_signMessage', params);
        return result.signatureSerialized;
      }
    },
  });

  useImperativeHandle(ref, () => ({
    personalSign: personalSignMutation.mutateAsync,
    signTypedData_v4: signTypedData_v4Mutation.mutateAsync,
    signMessage: solanaSignMutation.mutateAsync,
  }));

  const activeMutation =
    [personalSignMutation, signTypedData_v4Mutation, solanaSignMutation].find(
      (x) => x.status !== 'idle'
    ) || personalSignMutation;
  const isLoading = activeMutation.isLoading;
  const isSuccess = activeMutation.isSuccess;
  const isError = activeMutation.isError;

  // there is a small delay after using a holdable button
  // button should be disabled after successful sign to prevent a duplicating call
  const disabled = isLoading || Boolean(holdToSign && isSuccess);
  const title = buttonTitle || 'Sign';

  return isDeviceAccount(wallet) ? (
    <HardwareSignMessage
      ref={hardwareSignRef}
      ecosystem={getAddressType(wallet.address)}
      derivationPath={wallet.derivationPath}
      isSigning={isLoading}
      children={children}
      buttonTitle={isSuccess ? 'Signed' : buttonTitle}
      buttonKind={buttonKind}
      onClick={onClick}
      disabled={disabled}
      bluetoothSupportEnabled={Boolean(bluetoothSupportEnabled)}
      {...buttonProps}
    />
  ) : (
    <WithReadonlyWarningDialog
      address={wallet.address}
      onClick={onClick}
      render={({ handleClick }) =>
        holdToSign ? (
          <HoldableButton
            text={`Hold to ${title}`}
            successText={
              <HStack gap={4} alignItems="center">
                <CheckIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--positive-500)',
                  }}
                />
                <span>Signed</span>
              </HStack>
            }
            submittingText="Sending..."
            onClick={handleClick}
            success={isSuccess}
            submitting={isLoading}
            disabled={disabled}
            error={isError}
            kind={buttonKind}
            {...buttonProps}
          />
        ) : (
          <Button
            disabled={disabled}
            onClick={handleClick}
            kind={buttonKind}
            {...buttonProps}
          >
            {children || (isLoading ? 'Signing...' : title)}
          </Button>
        )
      }
    />
  );
});
