import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Surface } from 'src/ui/ui-kit/Surface';
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
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import { isDeviceAccount } from 'src/shared/types/validators';
import { HardwareSignMessage } from '../HardwareWalletConnection/HardwareSignMessage';
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

function applyAllowance(typedData: TypedData, allowanceQuantityBase: string) {
  return produce(typedData, (draft) => {
    draft.message.value = allowanceQuantityBase;
  });
}

function getPermitAllowanceQuantity({ message }: TypedData) {
  // Different ways to get an allowance quantity for Permit & Permit2
  return message.value || message.details?.amount;
}

function errorToMessage(error: Error) {
  if ('message' in error) {
    if (error.message.startsWith('LockedDeviceError')) {
      return 'Please, unlock your Ledger';
    } else {
      return error.message;
    }
  }
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
  allowanceQuantityBase,
  onSignSuccess,
  onReject,
}: {
  origin: string;
  wallet: ExternallyOwnedAccount;
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
  allowanceQuantityBase?: string;
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

  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const [advancedViewHref, allowanceViewHref] = useMemo(
    () =>
      [View.advanced, View.customAllowance].map(
        (view) => `?${setURLSearchParams(params, { view }).toString()}`
      ),
    [params]
  );

  const showErrorBoundary = useErrorBoundary();
  const [hardwareSignError, setHardwareSignError] = useState<Error | null>(
    null
  );

  const stringifiedData = useMemo(
    () =>
      JSON.stringify(
        allowanceQuantityBase
          ? applyAllowance(typedData, allowanceQuantityBase)
          : typedData
      ),
    [allowanceQuantityBase, typedData]
  );

  const { mutate: registerTypedDataSign } = useMutation({
    mutationFn: async (signature: string) => {
      walletPort.request('registerTypedDataSign', {
        rawTypedData: stringifiedData,
        address: wallet.address,
        initiator: origin,
      });
      return signature;
    },
    onSuccess: (signature) => onSignSuccess(signature),
  });

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
              allowanceQuantityBase={allowanceQuantityBase || undefined}
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
          <UIText kind="caption/regular" color="var(--negative-500)">
            {signTypedData_v4Mutation.isError
              ? getError(signTypedData_v4Mutation?.error).message
              : hardwareSignError
              ? errorToMessage(hardwareSignError)
              : null}
          </UIText>

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
            {isDeviceAccount(wallet) ? (
              <HardwareSignMessage
                derivationPath={wallet.derivationPath}
                getMessage={() => stringifiedData}
                type="signTypedData_v4"
                isSigning={signTypedData_v4Mutation.isLoading}
                onBeforeSign={() => setHardwareSignError(null)}
                onSignError={(error) => setHardwareSignError(error)}
                onSign={(signature) => {
                  try {
                    registerTypedDataSign(signature);
                  } catch (error) {
                    showErrorBoundary(error);
                  }
                }}
              />
            ) : (
              <Button
                disabled={signTypedData_v4Mutation.isLoading}
                onClick={() => {
                  signTypedData_v4Mutation.mutate({
                    typedData: stringifiedData,
                    initiator: origin,
                  });
                }}
              >
                {signTypedData_v4Mutation.isLoading ? 'Signing...' : 'Sign'}
              </Button>
            )}
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
  wallet: ExternallyOwnedAccount;
}) {
  const [params] = useSearchParams();

  const view = params.get('view') || View.default;

  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');

  const navigate = useNavigate();
  const { networks } = useNetworks();

  const typedData = useMemo(() => toTypedData(typedDataRaw), [typedDataRaw]);

  const requestedAllowanceQuantityBase = isPermit(typedData)
    ? getPermitAllowanceQuantity(typedData)
    : undefined;

  const [allowanceQuantityBase, setAllowanceQuantityBase] = useState('');

  const handleChangeAllowance = (value: BigNumber) => {
    setAllowanceQuantityBase(value.toString());
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
    if (allowanceQuantityBase) {
      result.value = allowanceQuantityBase;
    }
    return result;
  }, [interpretation, allowanceQuantityBase]);

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const handleReject = () => windowPort.reject(windowId);

  const singleAsset = interpretation?.action?.content?.single_asset;

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
            allowanceQuantityBase={
              allowanceQuantityBase || requestedAllowanceQuantityBase
            }
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
            asset={getFungibleAsset(singleAsset?.asset)}
            value={allowanceQuantityBase}
            requestedAllowanceQuantityBase={requestedAllowanceQuantityBase}
            chain={chain}
            onChange={handleChangeAllowance}
          />
        ) : null}
        {view === View.advanced && interpretationDataJSON ? (
          <TypedDataAdvancedView dataJSON={interpretationDataJSON} />
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
