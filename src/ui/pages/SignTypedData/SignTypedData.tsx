import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import ArrowDownIcon from 'jsx:src/ui/assets/arrow-down.svg';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import {
  isPermit,
  toTypedData,
} from 'src/modules/ethereum/message-signing/prepareTypedData';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { focusNode } from 'src/ui/shared/focusNode';
import { interpretSignature } from 'src/modules/ethereum/transactions/interpret';
import { Content, RenderArea } from 'react-area';
import { PageBottom } from 'src/ui/components/PageBottom';
import type { InterpretResponse } from 'src/modules/ethereum/transactions/types';
import type { Networks } from 'src/modules/networks/Networks';
import { PageTop } from 'src/ui/components/PageTop';
import { AllowanceView } from 'src/ui/components/AllowanceView';
import { produce } from 'immer';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { BUG_REPORT_BUTTON_HEIGHT } from 'src/ui/components/BugReportButton';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import { InterpretationState } from 'src/ui/components/InterpretationState';
import { hasCriticalWarning } from 'src/ui/components/InterpretationState/InterpretationState';
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import { TypedDataAdvancedView } from './TypedDataAdvancedView';

const TypedDataRow = React.forwardRef(
  ({ data }: { data: string }, ref: React.Ref<HTMLDivElement>) => {
    return (
      <Surface
        padding={16}
        style={{
          border: '2px solid var(--neutral-200)',
          maxHeight: 256,
          overflowY: 'auto',
          ['--surface-background-color' as string]: 'var(--white)',
        }}
      >
        <UIText
          kind="small/regular"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
        >
          {data}
        </UIText>
        <div ref={ref} style={{ display: 'hidden' }} />
      </Surface>
    );
  }
);

enum View {
  default = 'default',
  customAllowance = 'customAllowance',
}

function applyAllowance(typedData: TypedData, allowanceQuantityBase: string) {
  return produce(typedData, (draft) => {
    if (draft.message.details) {
      draft.message.details.amount = allowanceQuantityBase;
    } else {
      draft.message.value = allowanceQuantityBase;
    }
  });
}

function getPermitAllowanceQuantity({ message }: TypedData) {
  // Different ways to get an allowance quantity for Permit & Permit2
  return message.value || message.details?.amount;
}

function TypedDataDefaultView({
  origin,
  clientScope: clientScopeParam,
  wallet,
  chain,
  networks,
  typedDataRaw,
  typedData,
  interpretQuery,
  interpretation,
  allowanceQuantityBase,
  onSignSuccess,
  onReject,
  onOpenAdvancedView,
}: {
  origin: string;
  clientScope: string | null;
  wallet: ExternallyOwnedAccount;
  chain: Chain;
  networks: Networks;
  typedDataRaw: string;
  typedData: TypedData;
  interpretQuery: {
    isInitialLoading: boolean;
    isError: boolean;
    isFetched: boolean;
  };
  interpretation?: InterpretResponse | null;
  allowanceQuantityBase?: string;
  onSignSuccess: (signature: string) => void;
  onReject: () => void;
  onOpenAdvancedView: () => void;
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

  const signMsgBtnRef = useRef<SignMsgBtnHandle | null>(null);

  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const allowanceViewHref = useMemo(
    () => `?${setURLSearchParams(params, { view: View.customAllowance })}`,
    [params]
  );

  const stringifiedData = useMemo(() => {
    const newTypedData = allowanceQuantityBase
      ? applyAllowance(typedData, allowanceQuantityBase)
      : typedData;
    return JSON.stringify(newTypedData);
  }, [allowanceQuantityBase, typedData]);

  const clientScope = clientScopeParam || 'External Dapp';

  const { mutate: signTypedData_v4, ...signTypedData_v4Mutation } = useMutation(
    {
      mutationFn: async () => {
        invariant(signMsgBtnRef.current, 'SignMessageButton not found');

        return signMsgBtnRef.current.signTypedData_v4({
          typedData: stringifiedData,
          initiator: origin,
          clientScope,
        });
      },
      // The value returned by onMutate can be accessed in
      // a global onError handler (src/ui/shared/requests/queryClient.ts)
      // TODO: refactor to just emit error directly from the mutationFn
      onMutate: () => '_signTypedData',
      onSuccess: onSignSuccess,
    }
  );

  const footerContentRef = useRef<HTMLDivElement | null>(null);
  const [seenSigningData, setSeenSigningData] = useState(true);
  const typedDataRowRef = useRef<HTMLDivElement | null>(null);
  const onTypedDataRowRefSet = useCallback((node: HTMLDivElement | null) => {
    if (!node || !footerContentRef?.current) {
      return;
    }
    const footerHeight = footerContentRef.current.getBoundingClientRect().top;
    const rootMargin =
      window.innerHeight + BUG_REPORT_BUTTON_HEIGHT - footerHeight;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeenSigningData(true);
          observer.disconnect();
        } else {
          setSeenSigningData(false);
        }
      },
      { rootMargin: `-${rootMargin}px` }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const disposables = useRef<Array<() => void>>([]);
  useEffect(() => {
    disposables.current.forEach((l) => l());
  }, []);

  const setTypedDataRow = (node: HTMLDivElement | null) => {
    typedDataRowRef.current = node;
    const unlisten = onTypedDataRowRefSet(node);
    if (unlisten) {
      disposables.current.push(unlisten);
    }
  };

  const scrollSigningData = () =>
    typedDataRowRef?.current?.scrollIntoView({ behavior: 'smooth' });

  const interpretationHasCriticalWarning = hasCriticalWarning(
    interpretation?.warnings
  );

  const showRawTypedData = !addressAction;

  const shouldScrollBeforeSigning = !seenSigningData && showRawTypedData;

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
        {addressAction ? (
          <AddressActionDetails
            recipientAddress={recipientAddress}
            addressAction={addressAction}
            chain={chain}
            networks={networks}
            actionTransfers={addressAction?.content?.transfers}
            wallet={wallet}
            singleAsset={addressAction?.content?.single_asset}
            allowanceQuantityBase={allowanceQuantityBase || null}
            showApplicationLine={true}
            singleAssetElementEnd={
              allowanceQuantityBase &&
              addressAction.type.value === 'approve' ? (
                <UIText
                  as={TextLink}
                  kind="small/accent"
                  style={{ color: 'var(--primary)' }}
                  to={allowanceViewHref}
                >
                  Edit
                </UIText>
              ) : null
            }
          />
        ) : null}
        {showRawTypedData ? (
          <TypedDataRow ref={setTypedDataRow} data={typedDataFormatted} />
        ) : null}
        <HStack
          gap={8}
          style={{
            gridTemplateColumns: interpretation?.input ? '1fr 1fr' : '1fr',
          }}
        >
          <InterpretationState
            interpretation={interpretation}
            interpretQuery={interpretQuery}
          />
          {interpretation?.input ? (
            <Button kind="regular" onClick={onOpenAdvancedView} size={36}>
              Advanced View
            </Button>
          ) : null}
        </HStack>
      </VStack>
      <Spacer height={16} />
      <Content name="sign-transaction-footer">
        <div ref={footerContentRef}>
          <VStack
            style={{
              textAlign: 'center',
              marginTop: 'auto',
            }}
            gap={8}
          >
            {signTypedData_v4Mutation.isError ? (
              <UIText kind="caption/regular" color="var(--negative-500)">
                {txErrorToMessage(signTypedData_v4Mutation.error)}
              </UIText>
            ) : null}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: interpretationHasCriticalWarning
                  ? '1fr'
                  : '1fr 1fr',
                gap: 8,
              }}
            >
              <Button
                kind={interpretationHasCriticalWarning ? 'primary' : 'regular'}
                type="button"
                onClick={onReject}
                ref={focusNode}
              >
                Cancel
              </Button>

              <SignMessageButton
                wallet={wallet}
                ref={signMsgBtnRef}
                onClick={() => {
                  if (shouldScrollBeforeSigning) {
                    scrollSigningData();
                  } else {
                    signTypedData_v4();
                  }
                }}
                buttonKind={
                  interpretationHasCriticalWarning ? 'danger' : 'primary'
                }
                buttonTitle={
                  interpretationHasCriticalWarning
                    ? 'Proceed Anyway'
                    : undefined
                }
                children={
                  shouldScrollBeforeSigning ? (
                    <HStack gap={8} alignItems="center" justifyContent="center">
                      <span>Scroll</span>
                      <ArrowDownIcon style={{ width: 24, height: 24 }} />
                    </HStack>
                  ) : null
                }
              />
            </div>
          </VStack>
        </div>
      </Content>
    </>
  );
}

function SignTypedDataContent({
  origin,
  clientScope,
  typedDataRaw,
  wallet,
}: {
  origin: string;
  clientScope: string | null;
  typedDataRaw: string;
  wallet: ExternallyOwnedAccount;
}) {
  const [params] = useSearchParams();
  const { currency } = useCurrency();

  const view = params.get('view') || View.default;
  const advancedDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const openAdvancedView = useCallback(() => {
    advancedDialogRef.current?.showModal();
  }, []);

  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');

  const navigate = useNavigate();

  const [allowanceQuantityBase, setAllowanceQuantityBase] = useState('');

  const typedData = useMemo(() => {
    const result = toTypedData(typedDataRaw);
    if (allowanceQuantityBase) {
      if (result.message.details) {
        result.message.details.amount = allowanceQuantityBase;
      } else {
        result.message.value = allowanceQuantityBase;
      }
    }
    return result;
  }, [typedDataRaw, allowanceQuantityBase]);

  const requestedAllowanceQuantityBase = isPermit(typedData)
    ? getPermitAllowanceQuantity(typedData)
    : undefined;

  const handleChangeAllowance = (value: string) => {
    setAllowanceQuantityBase(value);
    navigate(-1);
  };

  const { data: chain } = useQuery({
    queryKey: ['requestChainForOrigin', origin],
    queryFn: () => requestChainForOrigin(origin),
    useErrorBoundary: true,
    suspense: true,
  });

  const { networks } = useNetworks(chain ? [chain.toString()] : undefined);
  const chainId = chain && networks ? networks.getChainId(chain) : null;

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: [
      'interpretSignature',
      wallet.address,
      chainId,
      typedData,
      currency,
    ],
    queryFn: () =>
      chainId
        ? interpretSignature({
            address: wallet.address,
            chainId,
            typedData,
            currency,
          })
        : null,
    enabled: Boolean(chainId),
    suspense: false,
    retry: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const handleReject = () => windowPort.reject(windowId);

  const singleAsset = interpretation?.action?.content?.single_asset;

  if (!networks || !chain) {
    return null;
  }

  return (
    <Background backgroundKind="white">
      <NavigationTitle title={null} documentTitle="Sign Typed Data" />
      <PageColumn
        // different surface color on backgroundKind="white"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {view === View.default ? (
          <TypedDataDefaultView
            origin={origin}
            clientScope={clientScope}
            wallet={wallet}
            chain={chain}
            networks={networks}
            typedDataRaw={typedDataRaw}
            typedData={typedData}
            interpretQuery={interpretQuery}
            interpretation={interpretation}
            allowanceQuantityBase={
              allowanceQuantityBase || requestedAllowanceQuantityBase
            }
            onSignSuccess={handleSignSuccess}
            onOpenAdvancedView={openAdvancedView}
            onReject={handleReject}
          />
        ) : null}
        <CenteredDialog
          ref={advancedDialogRef}
          renderWhenOpen={() => (
            <>
              <DialogTitle
                title={<UIText kind="body/accent">Advanced View</UIText>}
                closeKind="icon"
              />
              {interpretation?.input ? (
                <TypedDataAdvancedView data={interpretation.input} />
              ) : null}
            </>
          )}
        />
        {view === View.customAllowance ? (
          <AllowanceView
            address={wallet.address}
            asset={getFungibleAsset(singleAsset?.asset)}
            value={allowanceQuantityBase}
            requestedAllowanceQuantityBase={requestedAllowanceQuantityBase}
            chain={chain}
            onChange={handleChangeAllowance}
          />
        ) : null}
        <RenderArea name="transaction-warning-section" />
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={16} />
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
  const clientScope = params.get('clientScope');

  const typedDataRaw = params.get('typedDataRaw');
  invariant(
    typedDataRaw,
    'typedDataRaw get-parameter is required for this view'
  );

  return (
    <SignTypedDataContent
      typedDataRaw={typedDataRaw}
      origin={origin}
      clientScope={clientScope}
      wallet={wallet}
    />
  );
}
