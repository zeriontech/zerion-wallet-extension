import React, { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import { usePreferences } from 'src/ui/features/preferences';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { applyHyperliquidReferralCode } from 'src/modules/hyperliquid/referral/applyReferralCode';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { invariant } from 'src/shared/invariant';
import { emitter } from 'src/ui/shared/events';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'src/shared/errors/getErrorBase';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';

function DisclosureRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      gap={16}
      justifyContent="space-between"
      alignItems="center"
      style={{ padding: '12px 16px', borderTop: '1px solid var(--neutral-200)' }}
    >
      <UIText kind="small/regular" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText kind="body/accent" style={{ textAlign: 'end', minWidth: 0 }}>
        {value}
      </UIText>
    </HStack>
  );
}

/**
 * Consent + disclosure for applying Zerion's Hyperliquid referral code.
 * The code is always the runtime remote-config value; this component never
 * invents or hardcodes one.
 */
export function HyperliquidReferralPrompt({
  origin,
  wallet,
  code,
  onContinue,
  onDismiss,
}: {
  origin: string;
  wallet: ExternallyOwnedAccount;
  code: string;
  /** Resolve the pending eth_requestAccounts request. */
  onContinue: () => void;
  /** Resolve the connection without applying the code. */
  onDismiss: () => void;
}) {
  useBackgroundKind(whiteBackgroundKind);
  const signRef = useRef<SignMsgBtnHandle | null>(null);
  const { preferences } = usePreferences();
  const { globalPreferences } = useGlobalPreferences();
  const [state, setState] = useState<'prompt' | 'applied' | 'error'>('prompt');
  const [error, setError] = useState<unknown>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      emitter.emit('hyperliquidReferralPrompt', {
        action: 'clicked_apply',
        code_source: 'remote_config',
      });
      return applyHyperliquidReferralCode({
        code,
        signTypedData: async (typedData) => {
          invariant(signRef.current, 'SignMessageButton must be mounted');
          return signRef.current.signTypedData_v4({
            typedData,
            initiator: origin,
            clientScope: 'Hyperliquid Referral',
          });
        },
      });
    },
    onSuccess: () => {
      setError(null);
      setState('applied');
      emitter.emit('hyperliquidReferralPrompt', {
        action: 'applied',
        code_source: 'remote_config',
      });
    },
    onError: (mutationError) => {
      setError(mutationError);
      setState('error');
      emitter.emit('hyperliquidReferralPrompt', {
        action: 'failed',
        error_message: getError(mutationError).message,
        code_source: 'remote_config',
      });
    },
  });

  const dismiss = () => {
    emitter.emit('hyperliquidReferralPrompt', {
      action: 'dismissed',
      code_source: 'remote_config',
    });
    onDismiss();
  };

  return (
    <>
      <NavigationTitle title={null} documentTitle="Hyperliquid referral" />
      <PageTop />
      <PageColumn>
        <VStack gap={16}>
          <HStack gap={12} alignItems="center">
            <WalletAvatar address={wallet.address} size={40} borderRadius={12} />
            <VStack gap={0}>
              <UIText kind="body/accent">
                <WalletDisplayName wallet={wallet} />
              </UIText>
              <UIText kind="small/regular" color="var(--neutral-500)">
                Connecting to app.hyperliquid.xyz
              </UIText>
            </VStack>
          </HStack>
          <HStack gap={8} alignItems="center">
            <SiteFaviconImg size={20} url={origin} alt="Hyperliquid" />
            <UIText kind="small/accent" color="var(--neutral-600)">
              app.hyperliquid.xyz
            </UIText>
          </HStack>

          {state === 'applied' ? (
            <VStack gap={12}>
              <CheckIcon
                style={{ width: 40, height: 40, color: 'var(--positive-500)', placeSelf: 'center' }}
              />
              <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
                Referral code applied
              </UIText>
              <UIText
                kind="body/regular"
                color="var(--neutral-600)"
                style={{ textAlign: 'center' }}
              >
                Hyperliquid now takes 4% off your trading fees.
              </UIText>
            </VStack>
          ) : (
            <>
              <VStack gap={8}>
                <UIText kind="headline/h2">Save 4% on Hyperliquid fees</UIText>
                <UIText kind="body/regular" color="var(--neutral-600)">
                  Add Zerion&apos;s referral code to your Hyperliquid account and Hyperliquid takes
                  4% off your trading fees.
                </UIText>
              </VStack>
              <Frame>
                <VStack gap={0}>
                  <DisclosureRow label="Your discount" value="4% of trading fees" />
                  <DisclosureRow label="Applies to" value="Hyperliquid trading fees" />
                  <DisclosureRow
                    label="Zerion earns"
                    value="10% of your fees, paid by Hyperliquid"
                  />
                  <DisclosureRow label="What you sign" value="One message, no funds move" />
                </VStack>
              </Frame>
              <UIText kind="small/regular" color="var(--neutral-600)">
                Only for funded accounts with no referrer yet. An account can have only one referral
                code, and it can&apos;t be changed later.
              </UIText>
            </>
          )}

          {error ? (
            <ErrorMessage error={getError(error)} hardwareError={getHardwareError(error)} />
          ) : null}
        </VStack>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: state === 'applied' ? '1fr' : '1fr 1fr',
            gap: 8,
            marginTop: 'auto',
            paddingBottom: 32,
          }}
        >
          {state === 'applied' ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <>
              <Button kind="regular" type="button" onClick={dismiss} disabled={mutation.isLoading}>
                Not now
              </Button>
              {preferences && globalPreferences ? (
                <SignMessageButton
                  wallet={wallet}
                  ref={signRef}
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isLoading}
                  buttonTitle={
                    mutation.isLoading
                      ? 'Applying…'
                      : state === 'error'
                        ? 'Try again'
                        : 'Apply code'
                  }
                  holdToSign={preferences.enableHoldToSignButton}
                  bluetoothSupportEnabled={globalPreferences.bluetoothSupportEnabled}
                />
              ) : null}
            </>
          )}
        </div>
        {state === 'error' ? (
          <Button kind="text-primary" type="button" onClick={dismiss} style={{ marginBottom: 16 }}>
            Continue without the code
          </Button>
        ) : null}
      </PageColumn>
    </>
  );
}
