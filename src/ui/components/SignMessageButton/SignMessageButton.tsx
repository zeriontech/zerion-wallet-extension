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
import { wait } from 'src/shared/wait';
import { WithReadonlyWarningDialog } from '../SignTransactionButton/ReadonlyWarningDialog';

type PersonalSignParams = MessageContextParams & {
  params: [string];
};

type SignTypedDataParams = MessageContextParams & {
  typedData: string | TypedData;
};

export interface SignMsgBtnHandle {
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
    ...buttonProps
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    wallet: ExternallyOwnedAccount;
    buttonTitle?: React.ReactNode;
    buttonKind?: ButtonKind;
    holdToSign: boolean | null;
  },
  ref: React.Ref<SignMsgBtnHandle>
) {
  const hardwareSignRef = useRef<SignMessageHandle | null>(null);

  const { mutateAsync: personalSignInner, ...personalSignMutationInner } =
    useMutation({
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

  const { mutateAsync: personalSign, ...personalSignMutation } = useMutation({
    mutationFn: async (params: PersonalSignParams) => {
      const result = await personalSignInner(params);
      if (!isDeviceAccount(wallet) && holdToSign) {
        await wait(500);
      }
      return result;
    },
  });

  const {
    mutateAsync: signTypedData_v4Inner,
    ...signTypedData_v4MutationInner
  } = useMutation({
    mutationFn: async (params: SignTypedDataParams) => {
      if (isDeviceAccount(wallet)) {
        const { typedData, ...messageContextParams } = params;
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
          ...messageContextParams,
        });
        return signature;
      } else {
        return await walletPort.request('signTypedData_v4', params);
      }
    },
  });

  const { mutateAsync: signTypedData_v4, ...signTypedData_v4Mutation } =
    useMutation({
      mutationFn: async (params: SignTypedDataParams) => {
        const result = await signTypedData_v4Inner(params);
        if (!isDeviceAccount(wallet) && holdToSign) {
          await wait(500);
        }
        return result;
      },
    });

  useImperativeHandle(ref, () => ({ personalSign, signTypedData_v4 }));

  const isLoading =
    personalSignMutation.isLoading || signTypedData_v4Mutation.isLoading;
  const isLoadingInner =
    personalSignMutationInner.isLoading ||
    signTypedData_v4MutationInner.isLoading;
  const isSuccess =
    personalSignMutationInner.isSuccess ||
    signTypedData_v4MutationInner.isSuccess;
  const isError =
    personalSignMutation.isError || signTypedData_v4Mutation.isError;

  const title = buttonTitle || 'Sign';

  return isDeviceAccount(wallet) ? (
    <HardwareSignMessage
      ref={hardwareSignRef}
      derivationPath={wallet.derivationPath}
      isSigning={isLoading}
      children={children}
      buttonTitle={buttonTitle}
      buttonKind={buttonKind}
      onClick={onClick}
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
            submitting={isLoadingInner}
            disabled={isLoading}
            error={isError}
            kind={buttonKind}
            {...buttonProps}
          />
        ) : (
          <Button
            disabled={isLoading}
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
