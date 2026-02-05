import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { useBackgroundKind } from 'src/ui/components/Background';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { invariant } from 'src/shared/invariant';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import {
  isPermit,
  toTypedData,
} from 'src/modules/ethereum/message-signing/prepareTypedData';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { focusNode } from 'src/ui/shared/focusNode';
import { interpretSignature } from 'src/ui/shared/requests/interpret';
import { Content, RenderArea } from 'react-area';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageTop } from 'src/ui/components/PageTop';
import { AllowanceView } from 'src/ui/components/AllowanceView';
import { produce } from 'immer';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import {
  DialogButtonValue,
  DialogTitle,
} from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { usePreferences } from 'src/ui/features/preferences';
import { wait } from 'src/shared/wait';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import ScrollIcon from 'jsx:src/ui/assets/scroll.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import {
  hasCriticalWarning,
  InterpretationSecurityCheck,
  SecurityStatusBackground,
} from 'src/ui/shared/security-check';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { getError } from 'get-error';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { getActionApproval } from 'src/modules/ethereum/transactions/addressAction';
import { baseToCommon } from 'src/shared/units/convert';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import { getDecimals } from 'src/modules/networks/asset';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import type { PopoverToastHandle } from '../Settings/PopoverToast';
import { PopoverToast } from '../Settings/PopoverToast';
import { AddressActionNetworkFee } from '../SendTransaction/TransactionConfiguration/TransactionConfiguration';
import { TypedDataAdvancedView } from './TypedDataAdvancedView';

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
  network,
  typedDataRaw,
  typedData,
  interpretQuery,
  interpretation,
  allowanceQuantityCommon,
  allowanceQuantityBase,
  customAllowanceQuantityBase,
  onSignSuccess,
  onReject,
  onOpenAdvancedView,
}: {
  origin: string;
  clientScope: string | null;
  wallet: ExternallyOwnedAccount;
  network: NetworkConfig;
  typedDataRaw: string;
  typedData: TypedData;
  interpretQuery: {
    isInitialLoading: boolean;
    isError: boolean;
    isFetched: boolean;
  };
  interpretation?: SignatureInterpretResponse | null;
  allowanceQuantityCommon: string | null;
  allowanceQuantityBase: string | null;
  customAllowanceQuantityBase: string | null;
  onSignSuccess: (signature: string) => void;
  onReject: () => void;
  onOpenAdvancedView: () => void;
}) {
  const toastRef = useRef<PopoverToastHandle>(null);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const [params] = useSearchParams();
  const { preferences } = usePreferences();
  const { globalPreferences } = useGlobalPreferences();

  const addressAction = interpretation?.data.action;

  const title =
    addressAction?.type.displayValue ||
    (isPermit(typedData) ? 'Permit' : 'Sign Message');

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
      onSuccess: async (signature) => {
        if (preferences?.enableHoldToSignButton) {
          await wait(500);
        }
        onSignSuccess(signature);
      },
    }
  );

  const interpretationHasCriticalWarning = hasCriticalWarning(
    interpretation?.data.warnings
  );

  const showRawTypedData = !addressAction;

  const { handleCopy } = useCopyToClipboard({
    text: typedDataFormatted,
    onSuccess: () => toastRef.current?.showToast(),
  });

  return (
    <>
      <SecurityStatusBackground />
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Copied to Clipboard
      </PopoverToast>
      <BottomSheetDialog ref={dialogRef} height="fit-content">
        <VStack gap={24}>
          <VStack
            gap={0}
            style={{
              backgroundColor: 'var(--neutral-100)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <UIText kind="small/regular" color="var(--neutral-600)">
              Data
            </UIText>
            <UIText
              kind="body/regular"
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
              {typedDataFormatted}
            </UIText>
          </VStack>
          <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
            <Button
              value={DialogButtonValue.cancel}
              kind="primary"
              style={{ width: '100%' }}
              onClick={handleCopy}
            >
              <HStack gap={8} alignItems="center" justifyContent="center">
                <span>Copy Raw Data</span>
                <CopyIcon />
              </HStack>
            </Button>
          </form>
        </VStack>
      </BottomSheetDialog>
      <PageTop />
      <VStack gap={8}>
        <VStack
          gap={8}
          style={{
            justifyItems: 'center',
            paddingBlock: 24,
            border: '1px solid var(--neutral-200)',
            backgroundColor: 'var(--light-background-transparent)',
            backdropFilter: 'blur(16px)',
            borderRadius: 12,
          }}
        >
          <SiteFaviconImg
            size={64}
            style={{ borderRadius: 16 }}
            url={origin}
            alt={`Logo for ${origin}`}
          />
          <UIText kind="headline/h2">{title}</UIText>
          <UIText kind="small/accent" color="var(--neutral-500)">
            {origin === INTERNAL_ORIGIN ? (
              'Zerion'
            ) : originForHref ? (
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
          <HStack gap={8} alignItems="center">
            <WalletAvatar
              address={wallet.address}
              size={20}
              active={false}
              borderRadius={6}
            />
            <UIText kind="small/regular">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          </HStack>
        </VStack>
        <VStack gap={16}>
          {addressAction ? (
            <VStack gap={4}>
              <AddressActionDetails
                address={wallet.address}
                addressAction={addressAction}
                network={network}
                allowanceQuantityCommon={allowanceQuantityCommon || null}
                customAllowanceQuantityBase={
                  customAllowanceQuantityBase || null
                }
                showApplicationLine={true}
                singleAssetElementEnd={
                  allowanceQuantityCommon &&
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
            </VStack>
          ) : null}
          {showRawTypedData ? (
            <UnstyledButton
              onClick={() => dialogRef.current?.showModal()}
              className="parent-hover"
              style={{
                textAlign: 'start',
                padding: '12px 12px 0',
                backgroundColor: 'var(--neutral-100)',
                borderRadius: 12,
                ['--parent-content-color' as string]: 'var(--neutral-500)',
                ['--parent-hovered-content-color' as string]: 'var(--black)',
              }}
            >
              <HStack gap={16} justifyContent="space-between">
                <HStack gap={8}>
                  <ScrollIcon />
                  <VStack gap={0} style={{ position: 'relative' }}>
                    <UIText kind="small/regular" color="var(--neutral-600)">
                      Data
                    </UIText>
                    <UIText
                      kind="body/accent"
                      style={{
                        position: 'relative',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 48,
                      }}
                    >
                      {typedDataFormatted}
                    </UIText>
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0 0 0 0',
                        pointerEvents: 'none',
                        background:
                          'linear-gradient(180deg, transparent 50%, var(--neutral-100) 100%)',
                      }}
                    />
                  </VStack>
                </HStack>
                <ArrowDownIcon
                  className="content-hover"
                  style={{ width: 24, height: 24, alignSelf: 'center' }}
                />
              </HStack>
            </UnstyledButton>
          ) : null}
          <HStack
            gap={8}
            style={{
              gridTemplateColumns: showRawTypedData ? '1fr' : '1fr 1fr',
            }}
          >
            <InterpretationSecurityCheck
              interpretation={interpretation}
              interpretQuery={interpretQuery}
            />
            {showRawTypedData ? null : (
              <Button
                kind="regular"
                onClick={onOpenAdvancedView}
                size={44}
                className="parent-hover"
                style={{
                  textAlign: 'start',
                  borderRadius: 100,
                  ['--parent-content-color' as string]: 'var(--neutral-500)',
                  ['--parent-hovered-content-color' as string]: 'var(--black)',
                }}
              >
                <HStack gap={0} alignItems="center" justifyContent="center">
                  <ScrollIcon />
                  <span>Details</span>
                  <ArrowDownIcon
                    className="content-hover"
                    style={{ width: 24, height: 24 }}
                  />
                </HStack>
              </Button>
            )}
          </HStack>
        </VStack>
      </VStack>
      <Spacer height={16} />
      <Content name="sign-transaction-footer">
        <div>
          <VStack
            style={{
              textAlign: 'center',
              marginTop: 'auto',
            }}
            gap={8}
          >
            {interpretation?.data.action?.fee ? (
              <div style={{ marginBottom: 8 }}>
                <AddressActionNetworkFee
                  fee={interpretation.data.action.fee}
                  isLoading={interpretQuery.isInitialLoading}
                />
              </div>
            ) : null}
            {signTypedData_v4Mutation.isError ? (
              <ErrorMessage
                error={getError(signTypedData_v4Mutation.error)}
                hardwareError={getHardwareError(signTypedData_v4Mutation.error)}
              />
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
              {preferences && globalPreferences ? (
                <SignMessageButton
                  wallet={wallet}
                  ref={signMsgBtnRef}
                  onClick={() => {
                    signTypedData_v4();
                  }}
                  buttonKind={
                    interpretationHasCriticalWarning ? 'danger' : 'primary'
                  }
                  buttonTitle={
                    interpretationHasCriticalWarning
                      ? 'Proceed Anyway'
                      : undefined
                  }
                  holdToSign={preferences.enableHoldToSignButton}
                  bluetoothSupportEnabled={
                    globalPreferences.bluetoothSupportEnabled
                  }
                />
              ) : null}
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
  useBackgroundKind(whiteBackgroundKind);
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
    queryKey: ['requestChainForOrigin', origin, wallet.address],
    queryFn: () =>
      requestChainForOrigin(origin, getAddressType(wallet.address)),
    useErrorBoundary: true,
    suspense: true,
  });

  const { networks } = useNetworks(chain ? [chain.toString()] : undefined);
  const chainId = chain && networks ? networks.getChainId(chain) : null;
  const network = chain && networks ? networks.getByNetworkId(chain) : null;

  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: [
      'interpretSignature',
      wallet.address,
      chain,
      typedData,
      currency,
      origin,
      source,
    ],
    queryFn: () =>
      chain
        ? interpretSignature(
            {
              address: wallet.address,
              chain: chain.toString(),
              typedData,
              currency,
              origin,
            },
            { source }
          )
        : null,
    enabled: Boolean(chainId && network?.supports_simulations),
    suspense: false,
    retry: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const handleReject = () => windowPort.reject(windowId);

  const maybeApproval = interpretation?.data.action
    ? getActionApproval(interpretation.data.action)
    : null;

  const allowanceQuantityCommon =
    maybeApproval?.fungible && chain
      ? baseToCommon(
          allowanceQuantityBase || requestedAllowanceQuantityBase,
          getDecimals({ asset: maybeApproval.fungible, chain })
        ).toFixed()
      : null;

  const addressAction = interpretation?.data.action || null;

  if (!network) {
    return null;
  }

  return (
    <>
      <NavigationTitle title={null} documentTitle="Sign Typed Data" />
      <PageColumn
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {view === View.default ? (
          <TypedDataDefaultView
            origin={origin}
            clientScope={clientScope}
            wallet={wallet}
            network={network}
            typedDataRaw={typedDataRaw}
            typedData={typedData}
            interpretQuery={interpretQuery}
            interpretation={interpretation}
            customAllowanceQuantityBase={allowanceQuantityBase}
            allowanceQuantityBase={
              allowanceQuantityBase || requestedAllowanceQuantityBase
            }
            allowanceQuantityCommon={allowanceQuantityCommon}
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
                title={<UIText kind="body/accent">Details</UIText>}
                closeKind="icon"
              />
              <TypedDataAdvancedView typedData={typedData} />
            </>
          )}
        />
        {view === View.customAllowance ? (
          <AllowanceView
            address={wallet.address}
            assetId={maybeApproval?.fungible?.id}
            value={allowanceQuantityBase}
            requestedAllowanceQuantityBase={requestedAllowanceQuantityBase}
            network={network}
            onChange={handleChangeAllowance}
            addressAction={addressAction}
          />
        ) : null}
        <RenderArea name="transaction-warning-section" />
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={16} />
        <RenderArea name="sign-transaction-footer" />
        <PageBottom />
      </PageStickyFooter>
    </>
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
