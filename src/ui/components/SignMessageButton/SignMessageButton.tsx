import { useMutation } from '@tanstack/react-query';
import React, { useImperativeHandle, useRef, useState } from 'react';
import { ethers } from 'ethers';
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
import {
  KeyboardShortcut,
  ShortcutHint,
} from 'src/ui/components/KeyboardShortcut';
import { useWindowFocus } from 'src/ui/shared/useWindowFocus';
import { getAddressType } from 'src/shared/wallet/classifiers';
import {
  SigningPasswordGate,
  type SigningPasswordGateHandle,
} from 'src/ui/components/SigningPasswordGate';
import { WithReadonlyWarningDialog } from '../SignTransactionButton/ReadonlyWarningDialog';

/**
 * Converts a signature to the legacy format where v is 0 or 1 instead of 27 or 28.
 * The previous version of the extension used (v-27) as the last byte.
 */
function applyLegacySignature(signature: string): string {
  const sig = ethers.Signature.from(signature);
  const v = sig.v - 27;
  return sig.r + sig.s.slice(2) + v.toString(16).padStart(2, '0');
}

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
    requirePasswordToSign = false,
    bluetoothSupportEnabled,
    keyboardShortcutEnabled,
    ...buttonProps
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    wallet: ExternallyOwnedAccount;
    buttonTitle?: React.ReactNode;
    buttonKind?: ButtonKind;
    holdToSign: boolean | null;
    requirePasswordToSign?: boolean;
    bluetoothSupportEnabled: boolean | null;
    keyboardShortcutEnabled?: boolean | null;
    onClick?: () => void;
  },
  ref: React.Ref<SignMsgBtnHandle>
) {
  const hardwareSignRef = useRef<SignMessageHandle | null>(null);
  const passwordGateRef = useRef<SigningPasswordGateHandle | null>(null);
  const [legacySigning, setLegacySigning] = useState(false);

  const personalSignMutation = useMutation({
    mutationFn: async (params: PersonalSignParams) => {
      if (isDeviceAccount(wallet)) {
        const { params: methodParams, ...messageContextParams } = params;
        const [message] = methodParams;
        invariant(
          hardwareSignRef.current,
          'HardwareSignMessage must be mounted'
        );
        let signature = await hardwareSignRef.current.personalSign(message);
        if (legacySigning) {
          signature = applyLegacySignature(signature);
        }
        walletPort.request('registerPersonalSign', {
          message,
          address: wallet.address,
          ...messageContextParams,
        });
        return signature;
      } else {
        await passwordGateRef.current?.confirm();
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
        let signature = await hardwareSignRef.current.signTypedData_v4(
          typedData
        );
        if (legacySigning) {
          signature = applyLegacySignature(signature);
        }
        walletPort.request('registerTypedDataSign', {
          typedData,
          address: wallet.address,
          ...typedDataContext,
        });
        return signature;
      } else {
        await passwordGateRef.current?.confirm();
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
        await passwordGateRef.current?.confirm();
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
  const windowFocused = useWindowFocus();
  const shortcutActive =
    Boolean(keyboardShortcutEnabled) &&
    buttonKind !== 'danger' &&
    !disabled &&
    !isLoading;

  return isDeviceAccount(wallet) ? (
    <>
      <KeyboardShortcut
        combination="mod+enter"
        onKeyDown={() => onClick?.()}
        disabled={!shortcutActive}
      />
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
        keyboardShortcutEnabled={Boolean(keyboardShortcutEnabled)}
        legacySigning={legacySigning}
        onLegacySigningChange={setLegacySigning}
        {...buttonProps}
      />
    </>
  ) : (
    <>
      <SigningPasswordGate
        ref={passwordGateRef}
        requirePasswordToSign={requirePasswordToSign}
      />
      <WithReadonlyWarningDialog
        address={wallet.address}
        onClick={onClick}
        render={({ handleClick }) => (
          <>
            <KeyboardShortcut
              combination="mod+enter"
              onKeyDown={() => handleClick(null)}
              disabled={!shortcutActive}
            />
            {holdToSign ? (
              <HoldableButton
                text={
                  <HStack gap={4} alignItems="center" justifyContent="center">
                    {`Hold to ${title}`}
                    {shortcutActive && windowFocused ? <ShortcutHint /> : null}
                  </HStack>
                }
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
                style={shortcutActive ? { paddingInline: 0 } : undefined}
                {...buttonProps}
              />
            ) : (
              <Button
                disabled={disabled}
                onClick={handleClick}
                kind={buttonKind}
                style={shortcutActive ? { paddingInline: 0 } : undefined}
                {...buttonProps}
              >
                {children ||
                  (isLoading ? (
                    'Signing...'
                  ) : (
                    <HStack gap={4} alignItems="center" justifyContent="center">
                      {title}
                      {shortcutActive && windowFocused ? (
                        <ShortcutHint />
                      ) : null}
                    </HStack>
                  ))}
              </Button>
            )}
          </>
        )}
      />
    </>
  );
});
