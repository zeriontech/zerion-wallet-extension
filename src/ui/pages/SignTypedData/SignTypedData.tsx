import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
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
import {
  isPermit,
  toTypedData,
} from 'src/modules/ethereum/message-signing/prepareTypedData';
import type { Chain } from 'src/modules/networks/Chain';
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
import { Content, RenderArea } from 'react-area';
import { PageBottom } from 'src/ui/components/PageBottom';
import type { InterpretResponse } from 'src/modules/ethereum/transactions/types';
import type { Networks } from 'src/modules/networks/Networks';
import { PageTop } from 'src/ui/components/PageTop';
import type BigNumber from 'bignumber.js';
import { CustomAllowanceView } from 'src/ui/components/CustomAllowanceView';
import { produce } from 'immer';
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

enum View {
  default = 'default',
  advanced = 'advanced',
  customAllowance = 'customAllowance',
}

function applyAllowance(typedData: TypedData, allowance: string) {
  return produce(typedData, (draft) => {
    draft.message.value = allowance;
  });
}

function TypedDataDefaultView({
  origin,
  wallet,
  chain,
  networks,
  typedDataRaw,
  typedData,
  interpretQuery,
  interpretation,
  interpretationDataJSON,
  allowance,
  onSignSuccess,
  onReject,
}: {
  origin: string;
  wallet: BareWallet;
  chain: Chain;
  networks: Networks;
  typedDataRaw: string;
  typedData: TypedData;
  interpretQuery: {
    isLoading: boolean;
    isError: boolean;
    isFetched: boolean;
  };
  interpretation?: InterpretResponse | null;
  interpretationDataJSON: Record<string, unknown> | null;
  allowance: string | null;
  onSignSuccess: (signature: string) => void;
  onReject: () => void;
}) {
  const [params] = useSearchParams();

  const addressAction = interpretation?.action;
  const recipientAddress = addressAction?.label?.display_value.wallet_address;

  const title =
    addressAction?.type.display_value ||
    (isPermit(typedData) ? 'Permit' : 'Signature Request');

  const typedDataFormatted = useMemo(
    () => JSON.stringify(JSON.parse(typedDataRaw), null, 2),
    [typedDataRaw]
  );

  const interpretationDataFormatted = useMemo(() => {
    return interpretationDataJSON
      ? JSON.stringify(interpretationDataJSON, null, 2)
      : null;
  }, [interpretationDataJSON]);

  const signTypedData_v4Mutation = useSignTypedData_v4Mutation({
    onSuccess: onSignSuccess,
  });

  const someMutationError = signTypedData_v4Mutation.isError
    ? getError(signTypedData_v4Mutation.error)
    : null;

  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const [advancedViewHref, allowanceViewHref] = useMemo(
    () =>
      [View.advanced, View.customAllowance].map(
        (view) => `?${setURLSearchParams(params, { view }).toString()}`
      ),
    [params]
  );

  return (
    <>
      <PageTop />
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
        {addressAction ? (
          <>
            <AddressActionDetails
              recipientAddress={recipientAddress}
              addressAction={addressAction}
              chain={chain}
              networks={networks}
              actionTransfers={addressAction?.content?.transfers}
              wallet={wallet}
              singleAsset={addressAction?.content?.single_asset}
              allowance={allowance || undefined}
              allowanceViewHref={allowanceViewHref}
            />
            {interpretationDataJSON ? (
              <Button kind="regular" as={UnstyledLink} to={advancedViewHref}>
                Advanced View
              </Button>
            ) : null}
          </>
        ) : interpretQuery.isFetched ? (
          <TypedDataRow
            data={interpretationDataFormatted || typedDataFormatted}
          />
        ) : null}
      </VStack>
      <Spacer height={16} />
      <Content name="sign-transaction-footer">
        <VStack
          style={{
            textAlign: 'center',
            marginTop: 'auto',
            paddingTop: 8,
          }}
          gap={8}
        >
          {someMutationError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {someMutationError?.message}
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
              onClick={onReject}
              ref={focusNode}
            >
              Cancel
            </Button>
            <Button
              disabled={signTypedData_v4Mutation.isLoading}
              onClick={() => {
                const finalTypedData = allowance
                  ? applyAllowance(typedData, allowance)
                  : typedData;
                signTypedData_v4Mutation.mutate({
                  typedData: JSON.stringify(finalTypedData),
                  initiator: origin,
                });
              }}
            >
              {signTypedData_v4Mutation.isLoading ? 'Signing...' : 'Sign'}
            </Button>
          </div>
        </VStack>
      </Content>
    </>
  );
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

  const navigate = useNavigate();
  const { networks } = useNetworks();

  const typedData = useMemo(() => toTypedData(typedDataRaw), [typedDataRaw]);

  const [allowance, setAllowance] = useState<string | null>(
    isPermit(typedData) ? typedData.message.value : null
  );
  const handleChangeAllowance = (newAllowance: BigNumber) => {
    setAllowance(newAllowance.toString());
    navigate(-1);
  };

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

  const interpretationDataJSON = useMemo(() => {
    if (!interpretation) return null;
    const data = getInterpretationData(interpretation);
    const result = JSON.parse(data) as Record<string, unknown>;
    if (allowance) {
      result.value = allowance;
    }
    return result;
  }, [interpretation, allowance]);

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const handleReject = () => windowPort.reject(windowId);

  if (!networks || !chain) {
    return null;
  }

  return (
    <Background backgroundKind="white">
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
      <PageColumn
        // different surface color on backgroundKind="white"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {view === View.default ? (
          <TypedDataDefaultView
            origin={origin}
            wallet={wallet}
            chain={chain}
            networks={networks}
            typedDataRaw={typedDataRaw}
            typedData={typedData}
            interpretQuery={interpretQuery}
            interpretation={interpretation}
            interpretationDataJSON={interpretationDataJSON}
            allowance={allowance}
            onSignSuccess={handleSignSuccess}
            onReject={handleReject}
          />
        ) : null}
        {view === View.advanced && interpretationDataJSON ? (
          <TypedDataAdvancedView dataJSON={interpretationDataJSON} />
        ) : null}
        {view === View.customAllowance ? (
          <CustomAllowanceView
            address={wallet.address}
            singleAsset={interpretation?.action?.content?.single_asset}
            allowance={allowance || undefined}
            chain={chain}
            onChange={handleChangeAllowance}
          />
        ) : null}
        {view === View.advanced && interpretationDataJSON ? (
          <TypedDataAdvancedView data={interpretationDataJSON} />
        ) : null}
        <Spacer height={16} />
        <PhishingDefenceStatus origin={origin} />
      </PageColumn>
      <PageStickyFooter>
        <RenderArea name="sign-transaction-footer" />
        <PageBottom />
      </PageStickyFooter>
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
