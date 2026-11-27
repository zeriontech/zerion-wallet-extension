import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useBackgroundKind } from 'src/ui/components/Background';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ToggleSettingLine } from 'src/ui/pages/Settings/ToggleSettingsLine';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useGlobalPreferences, usePreferences } from 'src/ui/features/preferences/usePreferences';
import { usePerpsRemoteConfig } from 'src/modules/hyperliquid/hooks/usePerpsRemoteConfig';
import { useApprovedBuilders } from 'src/modules/hyperliquid/hooks/useApprovedBuilders';
import { buildApproveBuilderFeeAction } from 'src/modules/hyperliquid/actions/buildApproveBuilderFeeAction';
import { buildUserSignedActionTypedData } from 'src/modules/hyperliquid/signature/buildUserSignedActionTypedData';
import { parseSignatureHex } from 'src/modules/hyperliquid/signature/parseSignature';
import { submitExchangeAction } from 'src/modules/hyperliquid/api/submitExchangeAction';
import { builderFeeUnitToMaxFeeRateString } from 'src/modules/hyperliquid/fees/calculateFeeRate';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'src/shared/errors/getErrorBase';

function abbreviateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function RevokeBuilderFeeButton({ address, builder }: { address: string; builder: string }) {
  const signRef = useRef<SignMsgBtnHandle | null>(null);
  const queryClient = useQueryClient();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
  });
  const { preferences } = usePreferences();
  const { globalPreferences } = useGlobalPreferences();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const nonce = Date.now();
      const action = buildApproveBuilderFeeAction({
        maxFeeRate: '0%',
        builder,
        nonce,
      });
      const typedData = buildUserSignedActionTypedData(action);
      const signatureHex = await signRef.current?.signTypedData_v4({
        typedData,
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Hyperliquid Settings',
      });
      if (!signatureHex) {
        throw new Error('Signature was not produced');
      }
      return submitExchangeAction({
        action,
        nonce,
        signature: parseSignatureHex(signatureHex),
      });
    },
    onSuccess: () => {
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['hyperliquid/approvedBuilders', address] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'hyperliquid/maxBuilderFee' && query.queryKey[1] === address,
      });
    },
    onError: (error) => {
      setSubmitError(error);
    },
  });

  if (!wallet || !preferences || !globalPreferences) {
    return null;
  }

  return (
    <VStack gap={4} style={{ maxWidth: 140 }}>
      <SignMessageButton
        wallet={wallet}
        ref={signRef}
        onClick={() => mutation.mutate()}
        buttonKind="regular"
        buttonTitle={mutation.isLoading ? 'Revoking…' : 'Revoke'}
        holdToSign={false}
        bluetoothSupportEnabled={globalPreferences.bluetoothSupportEnabled}
      />
      {submitError ? <ErrorMessage error={getError(submitError)} hardwareError={null} /> : null}
    </VStack>
  );
}

function BuilderApprovals({ address }: { address: string }) {
  const { data: config } = usePerpsRemoteConfig();
  const { approvals, isLoading, isError, isEmpty, refetch } = useApprovedBuilders({ address });
  const zerionBuilder = config?.builderAddress?.toLowerCase();

  return (
    <Frame>
      <VStack gap={0}>
        <VStack gap={2} style={{ padding: 16 }}>
          <UIText kind="body/accent">Hyperliquid fee approvals</UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Approvals let a builder charge a fee on your Hyperliquid orders. Revoking signs a 0%
            approval, which takes effect immediately.
          </UIText>
        </VStack>
        {isLoading ? (
          <UIText kind="small/regular" color="var(--neutral-500)" style={{ padding: 16 }}>
            Loading approvals…
          </UIText>
        ) : isError ? (
          <VStack gap={8} style={{ padding: 16 }}>
            <UIText kind="small/regular" color="var(--negative-500)">
              Could not load Hyperliquid approvals.
            </UIText>
            <Button kind="regular" size={36} onClick={() => refetch()}>
              Retry
            </Button>
          </VStack>
        ) : isEmpty ? (
          <UIText kind="small/regular" color="var(--neutral-500)" style={{ padding: 16 }}>
            No builder-fee approvals for this account.
          </UIText>
        ) : (
          approvals.map(({ builder, maxFeeUnits }) => {
            const isZerion = zerionBuilder === builder.toLowerCase();
            const fee =
              maxFeeUnits == null ? 'Unknown' : builderFeeUnitToMaxFeeRateString(maxFeeUnits);
            return (
              <HStack
                key={builder}
                gap={12}
                justifyContent="space-between"
                alignItems="center"
                style={{ padding: '12px 16px', borderTop: '1px solid var(--neutral-200)' }}
              >
                <VStack gap={0} style={{ minWidth: 0 }}>
                  <UIText kind="body/accent">{isZerion ? 'Zerion' : 'Unknown builder'}</UIText>
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    {abbreviateAddress(builder)}
                  </UIText>
                  <UIText kind="small/regular" color="var(--neutral-600)">
                    Max fee {fee}
                  </UIText>
                </VStack>
                {maxFeeUnits === 0 ? (
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    Revoked
                  </UIText>
                ) : (
                  <RevokeBuilderFeeButton address={address} builder={builder} />
                )}
              </HStack>
            );
          })
        )}
      </VStack>
    </Frame>
  );
}

export function HyperliquidSettings() {
  useBackgroundKind({ kind: 'white' });
  const { singleAddress } = useAddressParams();
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const feeProtectionEnabled = globalPreferences?.hyperliquidFeeProtection !== false;

  return (
    <PageColumn>
      <NavigationTitle title="Hyperliquid" />
      <PageTop />
      <VStack gap={16}>
        <Frame>
          <ToggleSettingLine
            text="Extra Fee Protection"
            checked={feeProtectionEnabled}
            onChange={(event) => {
              setGlobalPreferences({ hyperliquidFeeProtection: event.target.checked });
            }}
            detailText={
              <span>
                Block non-zero builder-fee approvals on the official Hyperliquid site. Missing or
                malformed fee values count as a fee.
              </span>
            }
          />
        </Frame>
        {singleAddress ? <BuilderApprovals address={singleAddress} /> : null}
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
