import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Surface } from 'src/ui/ui-kit/Surface';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { Background } from 'src/ui/components/Background';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { getError } from 'src/shared/errors/getError';
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { useSignTypedData_v4Mutation } from 'src/ui/shared/requests/message-signing';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { toTypedData } from 'src/modules/ethereum/message-signing/prepareTypedData';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { InterpretLoadingState } from 'src/ui/components/InterpretLoadingState';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { focusNode } from 'src/ui/shared/focusNode';
import {
  getInterpretationData,
  interpretSignature,
} from 'src/modules/ethereum/transactions/interpret';
import { PhishingDefenceStatus } from 'src/ui/components/PhishingDefence/PhishingDefenceStatus';
import { NavigationBar } from '../SignInWithEthereum/NavigationBar';
import { TypedDataAdvancedView } from './TypedDataAdvancedView';

function TypedDataRow({ data }: { data: string }) {
  return (
    <Surface padding={16} style={{ border: '1px solid var(--neutral-300)' }}>
      <UIText
        kind="small/regular"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {data}
      </UIText>
    </Surface>
  );
}

function isPermit({ message }: TypedData) {
  return Boolean(message.owner && message.spender && message.value);
}

enum View {
  default = 'default',
  advanced = 'advanced',
  customAllowance = 'customAllowance',
}

function SignTypedDataContent({
  origin,
  typedDataRaw,
  wallet,
}: {
  origin: string;
  typedDataRaw: string;
  wallet: BareWallet;
}) {
  const [params] = useSearchParams();
  const view = params.get('view') || View.default;

  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');

  const { networks } = useNetworks();

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const signTypedData_v4Mutation = useSignTypedData_v4Mutation({
    onSuccess: handleSignSuccess,
  });

  const signMutationError = signTypedData_v4Mutation.isError
    ? getError(signTypedData_v4Mutation.error)
    : null;
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const handleReject = () => windowPort.reject(windowId);

  const typedData = useMemo(() => toTypedData(typedDataRaw), [typedDataRaw]);
  const typedDataFormatted = useMemo(
    () => JSON.stringify(JSON.parse(typedDataRaw), null, 2),
    [typedDataRaw]
  );

  const { data: chain, ...chainQuery } = useQuery({
    queryKey: ['wallet/requestChainForOrigin', origin],
    queryFn: () =>
      walletPort
        .request('requestChainForOrigin', { origin })
        .then((chain) => createChain(chain)),
    useErrorBoundary: true,
    suspense: true,
  });

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: [
      'interpretSignature',
      wallet.address,
      chain,
      networks,
      typedData,
    ],
    queryFn: () =>
      chain && networks
        ? interpretSignature({
            address: wallet.address,
            chainId: networks.getChainId(chain),
            typedData,
          })
        : null,
    enabled: !chainQuery.isLoading && Boolean(networks),
    suspense: false,
    retry: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const addressAction = interpretation?.action;
  const recipientAddress = addressAction?.label?.display_value.wallet_address;
  const actionTransfers = addressAction?.content?.transfers;
  const singleAsset = addressAction?.content?.single_asset;

  const interpretationDataJSON = useMemo(() => {
    if (!interpretation) return null;
    const data = getInterpretationData(interpretation);
    return JSON.parse(data) as Record<string, unknown>;
  }, [interpretation]);

  const interpretationDataFormatted = useMemo(() => {
    return interpretationDataJSON
      ? JSON.stringify(interpretationDataJSON, null, 2)
      : null;
  }, [interpretationDataJSON]);

  const title =
    addressAction?.type.display_value ||
    (isPermit(typedData) ? 'Permit' : 'Signature Request');

  const advancedViewHref = useMemo(
    () => `?${setURLSearchParams(params, { view: View.advanced }).toString()}`,
    [params]
  );

  if (!networks || !chain) {
    return null;
  }

  return (
    <Background backgroundKind="white">
      <PageColumn
        // different surface color on backgroundKind="white"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {view === View.advanced ? (
          <NavigationBar title="Advanced View" />
        ) : null}
        <PageTop />
        {view === View.default ? (
          <>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
                {title}
              </UIText>
              <UIText kind="small/regular" color="var(--neutral-500)">
                {originForHref ? (
                  <TextAnchor
                    href={originForHref.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {originForHref.hostname}
                  </TextAnchor>
                ) : (
                  'Unknown Initiator'
                )}
              </UIText>
              <Spacer height={8} />
              <HStack gap={8} alignItems="center">
                <WalletAvatar
                  address={wallet.address}
                  size={20}
                  active={false}
                  borderRadius={4}
                />
                <UIText kind="small/regular">
                  <WalletDisplayName wallet={wallet} />
                </UIText>
              </HStack>
            </div>
            <Spacer height={24} />
            <VStack gap={16}>
              {interpretQuery.isLoading ? (
                <InterpretLoadingState />
              ) : interpretQuery.isError ? (
                <UIText kind="small/regular" color="var(--notice-600)">
                  Unable to analyze the details of the transaction
                </UIText>
              ) : null}
              {interpretQuery.isFetched ? (
                addressAction ? (
                  <>
                    <AddressActionDetails
                      recipientAddress={recipientAddress}
                      addressAction={addressAction}
                      chain={chain}
                      networks={networks}
                      actionTransfers={actionTransfers}
                      wallet={wallet}
                      singleAsset={singleAsset}
                    />
                    {interpretationDataJSON ? (
                      <Button
                        kind="regular"
                        as={UnstyledLink}
                        to={advancedViewHref}
                      >
                        Advanced View
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <TypedDataRow
                    data={interpretationDataFormatted || typedDataFormatted}
                  />
                )
              ) : (
                <TypedDataRow data={typedDataFormatted} />
              )}
            </VStack>
          </>
        ) : null}
        {view === View.advanced && interpretationDataJSON ? (
          <TypedDataAdvancedView data={interpretationDataJSON} />
        ) : null}
        <Spacer height={16} />
        <PhishingDefenceStatus origin={origin} />
      </PageColumn>
      <PageStickyFooter>
        <VStack
          style={{
            textAlign: 'center',
            marginTop: 'auto',
            paddingBottom: 24,
            paddingTop: 8,
          }}
          gap={8}
        >
          {signMutationError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {signMutationError?.message}
            </UIText>
          ) : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button
              kind="regular"
              type="button"
              onClick={handleReject}
              ref={focusNode}
            >
              Cancel
            </Button>
            <Button
              disabled={signTypedData_v4Mutation.isLoading}
              onClick={() => {
                signTypedData_v4Mutation.mutate({
                  typedData: typedDataRaw,
                  initiator: origin,
                });
              }}
            >
              {signTypedData_v4Mutation.isLoading ? 'Signing...' : 'Sign'}
            </Button>
          </div>
        </VStack>
      </PageStickyFooter>
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
    </Background>
  );
}

export function SignTypedData() {
  const [params] = useSearchParams();
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  if (isLoading || !wallet) {
    return null;
  }
  const origin = params.get('origin');
  invariant(origin, 'origin get-parameter is required for this view');

  const typedDataRaw = params.get('typedDataRaw');
  invariant(
    typedDataRaw,
    'typedDataRaw get-parameter is required for this view'
  );

  return (
    <SignTypedDataContent
      typedDataRaw={typedDataRaw}
      origin={origin}
      wallet={wallet}
    />
  );
}
