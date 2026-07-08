import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BigNumber from 'bignumber.js';
import { useStore } from '@store-unit/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletSimplePositions } from 'src/modules/zerion-api/hooks/useWalletSimplePositions';
import { useWalletNftPosition } from 'src/modules/zerion-api/hooks/useWalletNftPosition';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { toMultichainTransaction } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { applyConfiguration } from 'src/ui/pages/SendTransaction/TransactionConfiguration/applyConfiguration';
import {
  fromConfiguration,
  toConfiguration,
} from 'src/ui/pages/SendForm/shared/helpers';
import { PageColumn } from 'src/ui/components/PageColumn/PageColumn';
import { PageTop } from 'src/ui/components/PageTop/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink/UnstyledLink';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useBackgroundKind } from 'src/ui/components/Background';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { walletPort } from 'src/ui/shared/channels';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { resolveTokenValue } from 'src/ui/components/AmountInput/inputKind';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { invariant } from 'src/shared/invariant';
import { isReadonlyAccount } from 'src/shared/types/validators';
import { isNumeric } from 'src/shared/isNumeric';
import {
  useGlobalPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  signTransactions,
  getQueues,
  QueueAbortError,
  QueueError,
  type SignStep,
} from 'src/ui/components/TransactionSigner';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'get-error';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import {
  createSendTokenAddressAction,
  createSendNFTAddressAction,
} from 'src/modules/ethereum/transactions/addressAction/addressActionMain';
import type { SimulationResult } from 'src/ui/pages/SwapForm2/SwapButton';
import { TransactionWarning } from 'src/ui/pages/SwapForm2/TransactionWarning';
import { UnverifiedWarning } from 'src/ui/pages/SwapForm2/UnverifiedWarning/UnverifiedWarning';
import { ReadonlySignButton } from 'src/ui/pages/SwapForm2/ReadonlySignButton';
import { useReceiverName } from 'src/ui/components/ReceiverAddressDialog';
import { PopoverToast } from 'src/ui/pages/Settings/PopoverToast';
import type { PopoverToastHandle } from 'src/ui/pages/Settings/PopoverToast';
import { updateRecentAddresses } from 'src/ui/pages/SendForm/fieldsets/AddressInput/updateRecentAddresses';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { getAddressType } from 'src/shared/wallet/classifiers';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { UIText } from 'src/ui/ui-kit/UIText';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import type { SendFormState2 } from './types';
import { useFormState } from './useFormState';
import { useInputPosition } from './useInputPosition';
import { useSendTransaction } from './useSendTransaction';
import { fungiblePositionToAddressPosition } from './shared/fungiblePositionToAddressPosition';
import { nftPositionToDefiSdkNft } from './shared/nftPositionToDefiSdkNft';
import { InputPosition } from './InputPosition';
import { InputNftPosition } from './InputNftPosition';
import { NftPreview } from './NftPreview';
import { AssetSelectorDialog } from './PositionSelector/AssetSelectorDialog';
import { ReceiverAddressSelector } from './ReceiverAddressSelector';
import { SendDetails } from './SendDetails';
import { SendButton } from './SendButton';
import { resolveSendTransactionWarning } from './TransactionWarning';
import { SendFormSkeleton } from './SendFormSkeleton';
import * as styles from './SendForm2.module.css';

/**
 * Clears transient per-send inputs after a successful broadcast: the amount,
 * custom data, nonce, and all network-fee overrides. The token/NFT/chain
 * selection and the recipient are preserved (and stay in the URL) so the user
 * keeps the asset and recipient they just used instead of the form snapping
 * back to the highest-value position with an empty recipient.
 */
function resetAfterBroadcast(
  state: Partial<SendFormState2>
): Partial<SendFormState2> {
  return {
    ...state,
    inputAmount: undefined,
    inputKind: undefined,
    nftAmount: undefined,
    data: undefined,
    nonce: undefined,
    networkFeeSpeed: undefined,
    maxPriorityFee: undefined,
    maxFee: undefined,
    gasPrice: undefined,
    gasLimit: undefined,
  };
}

function SendFormComponent({
  address,
  positions,
  networks,
}: {
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const { currency } = useCurrency();
  const source = useHttpClientSource();
  const [formState, handleChange, setUserFormState, selectFungible, selectNft] =
    useFormState({ address, positions });

  const [lastTokensNetwork, setLastTokensNetwork] = useState<string | null>(
    null
  );
  const [lastNftsNetwork, setLastNftsNetwork] = useState<string | null>(null);

  const selectorDialog = useDialog2();

  const { position } = useInputPosition({
    address,
    formState,
    positions,
    networks,
  });

  const inputPrice = position?.fungible.meta.price ?? null;
  const inputKind = formState.inputKind ?? 'token';
  const resolvedInputAmount = useMemo(() => {
    if (!formState.inputAmount) return null;
    return resolveTokenValue(formState.inputAmount, inputKind, inputPrice);
  }, [formState.inputAmount, inputKind, inputPrice]);

  const nftEnabled = Boolean(formState.nftId);
  const { data: nftResponse, isLoading: nftLoading } = useWalletNftPosition(
    { address, currency, nftId: formState.nftId ?? '' },
    { source },
    { enabled: nftEnabled }
  );
  const nftPosition = nftResponse?.data ?? null;

  const { data: portfolioData } = useWalletPortfolio(
    { addresses: [address], currency },
    { source }
  );
  const nftChainsDistribution = useMemo(
    () => portfolioData?.data?.nftChainsDistribution ?? {},
    [portfolioData]
  );

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { preferences, setPreferences } = usePreferences();
  const { globalPreferences } = useGlobalPreferences();
  const { readonlyWallOverride } = useStore(devMenuStore);
  const readonlyWallDisabled = readonlyWallOverride === 'disabled';

  const isNftMode = Boolean(formState.nftId);
  const defaultMode = isNftMode ? 'nfts' : 'tokens';

  const handleSelectFungible = useCallback(
    (chainId: string, fungibleId: string) => {
      selectFungible(chainId, fungibleId);
    },
    [selectFungible]
  );

  const handleSelectNft = useCallback(
    (nftId: string, chainId: string) => {
      selectNft(nftId, chainId);
    },
    [selectNft]
  );

  const ecosystemMismatch = useMemo(() => {
    if (!formState.to) return null;
    let recipientEcosystem: BlockchainType;
    try {
      recipientEcosystem = getAddressType(formState.to);
    } catch {
      return null;
    }
    if (isMatchForEcosystem(address, recipientEcosystem)) return null;
    const senderEcosystem: BlockchainType = isMatchForEcosystem(address, 'evm')
      ? 'evm'
      : 'solana';
    const label = (e: BlockchainType) => (e === 'evm' ? 'Ethereum' : 'Solana');
    return `Recipient is on ${label(
      recipientEcosystem
    )}, but sending wallet is on ${label(senderEcosystem)}.`;
  }, [address, formState.to]);

  const sendNetwork = useMemo(() => {
    if (!formState.inputChain) return null;
    return networks.getNetworkByName(createChain(formState.inputChain)) ?? null;
  }, [networks, formState.inputChain]);

  const { data: sendData, isLoading: sendDataLoading } = useSendTransaction({
    address,
    formState,
    position,
    resolvedInputAmount,
    network: sendNetwork,
    enabled: !ecosystemMismatch,
  });

  const sendQuote = sendData?.sendQuote ?? null;
  const sendTransaction = sendQuote?.transactionSwap ?? null;
  const sendInputAmount = sendData?.inputAmount ?? null;
  const sendError = sendData?.error ?? null;

  // Single shared gas-prices fetch for the send chain. Powers preset pricing in
  // the network-fee dialog, the live displayed-fee scaling, and the gas applied
  // at sign time. Gas changes never refetch the send quote.
  const inputChainForGas = useMemo(
    () => (formState.inputChain ? createChain(formState.inputChain) : null),
    [formState.inputChain]
  );
  const { data: gasPrices } = useGasPrices(inputChainForGas, {
    refetchInterval: 20000,
    keepPreviousData: true,
  });

  // The client transaction we simulate and sign. `sendQuote.transactionSwap`
  // holds the backend `TransactionEVM`; convert it once to the client shape and
  // apply the selected network-fee override (preset or custom). EVM only —
  // applyConfiguration is a no-op shape for solana, which passes through
  // unchanged. The nonce is left to the sign mutation (it strips/overrides it
  // against the freshest state at sign time).
  const clientTransaction = useMemo<MultichainTransaction | null>(() => {
    const backendTx = sendQuote?.transactionSwap;
    if (!backendTx || (!backendTx.evm && !backendTx.solana)) return null;
    const clientTx = toMultichainTransaction(backendTx);
    if (!clientTx.evm) {
      return clientTx;
    }
    // Only apply the network-fee configuration when the user has actually
    // overridden a fee field. With everything default, the backend tx already
    // carries the right gas, so applying would just re-derive it (and would
    // pin gas to a possibly-stale `gasPrices` snapshot).
    const hasNetworkFeeOverride =
      formState.maxFee ||
      formState.maxPriorityFee ||
      formState.gasPrice ||
      formState.gasLimit ||
      formState.networkFeeSpeed;
    if (!hasNetworkFeeOverride) {
      return { evm: clientTx.evm };
    }
    const configured = applyConfiguration(
      clientTx.evm,
      toConfiguration(formState),
      gasPrices ?? null
    );
    return { evm: configured };
  }, [sendQuote, formState, gasPrices]);

  // Reset simulation/sign state when form state changes meaningfully.
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult>(null);
  const [hasSimulated, setHasSimulated] = useState(false);

  useEffect(() => {
    setSimulationResult(null);
    setHasSimulated(false);
  }, [
    formState.inputChain,
    formState.inputFungibleId,
    formState.inputAmount,
    formState.inputKind,
    formState.nftId,
    formState.nftAmount,
    formState.to,
    formState.data,
    formState.nonce,
    formState.gasLimit,
    formState.maxFee,
    formState.maxPriorityFee,
    formState.gasPrice,
    formState.networkFeeSpeed,
  ]);

  const resolved = useMemo(
    () =>
      resolveSendTransactionWarning({
        simulationResult,
        backendError: sendError,
        assetSymbol: position?.fungible.symbol ?? null,
        nativeAssetSymbol: sendNetwork?.native_asset?.symbol ?? null,
      }),
    [simulationResult, sendError, position, sendNetwork]
  );

  // USD price lookup for analytics — mirrors SwapForm2.
  const { data: inputFungibleUsdInfo } = useAssetListFungibles(
    formState.inputFungibleId
      ? { fungibleIds: [formState.inputFungibleId], currency: 'usd' }
      : { currency: 'usd' }
  );

  // Resolve the recipient to a friendly name (address book → wallet/watchlist
  // → domain handle) so the transaction toaster can show it instead of a raw
  // address. Resolved here in the form because the toaster is a global
  // singleton and can't run per-recipient lookups itself.
  const recipientName = useReceiverName(formState.to);

  const cancelToastRef = useRef<PopoverToastHandle>(null);
  const handleCancel = () => {
    setUserFormState(resetAfterBroadcast);
    queryClient.invalidateQueries(['transactionGetSend']);
    cancelToastRef.current?.showToast();
  };

  const { mutate: handleSignTransaction, ...signMutation } = useMutation({
    mutationFn: async (result: SimulationResult) => {
      invariant(wallet, 'Wallet must be loaded to sign');
      invariant(clientTransaction, 'Send transaction must be prepared');
      invariant(sendNetwork, 'Network must be defined');
      invariant(position, 'Position must be defined');
      invariant(formState.to, 'Recipient must be set');

      const addressPosition = fungiblePositionToAddressPosition(position);
      const interpretationAction = result?.data?.action ?? null;

      const userNonce =
        formState.nonce != null && isNumeric(formState.nonce)
          ? parseInt(formState.nonce)
          : null;

      // `clientTransaction` already has the selected network-fee override
      // applied. The prepared EVM tx comes back with a nonce that's stale once
      // another queue is in flight. Strip it so prepareNonce recomputes against
      // the freshest local+RPC state at sign time. Exception: a user-entered
      // nonce in form state overrides.
      const finalTransaction = clientTransaction.evm
        ? userNonce != null
          ? { evm: { ...clientTransaction.evm, nonce: userNonce } }
          : (() => {
              const { nonce: _omit, ...rest } = clientTransaction.evm;
              return { evm: rest as typeof clientTransaction.evm };
            })()
        : clientTransaction;

      const feeValueCommon = sendQuote?.networkFee?.amount?.quantity ?? null;

      const inputUsdPrice =
        inputFungibleUsdInfo?.data?.at(0)?.meta.price ?? null;
      const tokenPrice = position.fungible.meta.price;

      // Backend may shave gas off a max-send and return a different amount.
      // Use the backend's authoritative amount where present.
      const backendInputAmount = sendInputAmount;
      const sendQuantity =
        backendInputAmount?.quantity ??
        resolvedInputAmount ??
        formState.nftAmount ??
        '';
      const quantityBn = sendQuantity ? new BigNumber(sendQuantity) : null;
      const sendAmount = backendInputAmount
        ? { ...backendInputAmount, currency }
        : {
            currency,
            quantity: sendQuantity,
            value:
              quantityBn && tokenPrice != null
                ? quantityBn.multipliedBy(tokenPrice).toNumber()
                : null,
            usdValue:
              quantityBn && inputUsdPrice != null
                ? quantityBn.multipliedBy(inputUsdPrice).toNumber()
                : null,
          };

      const fallbackAddressAction =
        isNftMode && nftPosition
          ? createSendNFTAddressAction({
              address,
              hash: null,
              explorerUrl: null,
              transaction: finalTransaction,
              network: sendNetwork,
              receiverAddress: formState.to,
              sendAsset: nftPositionToDefiSdkNft(nftPosition),
              sendAmount: {
                currency,
                quantity: formState.nftAmount ?? '1',
                value: null,
                usdValue: null,
              },
            })
          : createSendTokenAddressAction({
              address,
              hash: null,
              explorerUrl: null,
              transaction: finalTransaction,
              network: sendNetwork,
              receiverAddress: formState.to,
              sendAsset: addressPosition.asset,
              sendAmount,
            });

      const tokenIconUrl = isNftMode
        ? nftPosition?.nft.metadata?.content?.imageUrl ??
          nftPosition?.nft.metadata?.content?.imagePreviewUrl ??
          null
        : position.fungible.iconUrl;
      const tokenSymbol = isNftMode
        ? nftPosition?.nft.metadata?.name ??
          nftPosition?.nft.collection?.name ??
          'NFT'
        : position.fungible.symbol;

      const steps: SignStep[] = [
        {
          kind: 'send',
          params: {
            transaction: finalTransaction,
            chain: formState.inputChain,
            initiator: INTERNAL_ORIGIN,
            clientScope: 'Send',
            feeValueCommon,
            addressAction: interpretationAction ?? fallbackAddressAction,
            warningWasShown: Boolean(resolved.warning),
            outputAmountColor: 'grey',
          },
          toaster: {
            kind: 'send',
            token: { symbol: tokenSymbol, iconUrl: tokenIconUrl },
            chain: { iconUrl: sendNetwork.icon_url ?? null },
            recipient: {
              address: formState.to,
              name: recipientName ?? undefined,
            },
            isNft: isNftMode,
          },
        },
      ];

      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        const { promise: queuePromise } = signTransactions(steps, {
          wallet,
          holdToSign: false,
          bluetoothSupportEnabled:
            globalPreferences?.bluetoothSupportEnabled ?? null,
          onEvent: (event) => {
            if (event.type === 'step-pending' && event.index === 0) {
              settle(() => {
                if (preferences && formState.to) {
                  setPreferences({
                    recentAddresses: updateRecentAddresses(
                      formState.to,
                      preferences.recentAddresses
                    ),
                  });
                }
                setUserFormState(resetAfterBroadcast);
                queryClient.invalidateQueries(['transactionGetSend']);
                resolve();
              });
            } else if (event.type === 'step-error' && event.index === 0) {
              settle(() => reject(event.error));
            } else if (event.type === 'queue-aborted' && event.index === 0) {
              settle(() => reject(new QueueAbortError(0, [])));
            }
          },
        });

        if (getQueues().length > 1) {
          settle(() => {
            if (preferences && formState.to) {
              setPreferences({
                recentAddresses: updateRecentAddresses(
                  formState.to,
                  preferences.recentAddresses
                ),
              });
            }
            setUserFormState(resetAfterBroadcast);
            queryClient.invalidateQueries(['transactionGetSend']);
            resolve();
          });
        }

        queuePromise.catch((err) => {
          const unwrapped =
            err instanceof QueueError && err.failedAt === 0 ? err.cause : err;
          settle(() => reject(unwrapped));
        });
      });
    },
    onError: (error) => {
      if (error instanceof QueueAbortError) return;
      // eslint-disable-next-line no-console
      console.error('SendForm2 sign failed', error);
    },
  });

  useEffect(() => {
    signMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formState.inputChain,
    formState.inputFungibleId,
    formState.inputAmount,
    formState.inputKind,
    formState.nftId,
    formState.nftAmount,
    formState.to,
    formState.data,
    formState.nonce,
    formState.gasLimit,
    formState.maxFee,
    formState.maxPriorityFee,
    formState.gasPrice,
    formState.networkFeeSpeed,
  ]);

  const handleSimulationCompleted = (result: SimulationResult) => {
    setSimulationResult(result);
    const fresh = resolveSendTransactionWarning({
      simulationResult: result,
      backendError: sendError,
      assetSymbol: position?.fungible.symbol ?? null,
      nativeAssetSymbol: sendNetwork?.native_asset?.symbol ?? null,
    });
    if (fresh.blocksAutoSign) {
      setHasSimulated(true);
      return;
    }
    handleSignTransaction(result);
  };

  const evmTx = clientTransaction?.evm ?? null;

  return (
    <>
      <PageColumn>
        <NavigationTitle
          title="Send"
          elementEnd={
            wallet ? (
              <UnstyledLink
                to="/wallet-select"
                title="Change Wallet"
                style={{ justifySelf: 'center' }}
              >
                <WalletAvatar
                  active={false}
                  address={address}
                  size={24}
                  borderRadius={6}
                />
              </UnstyledLink>
            ) : null
          }
        />
        <PageTop />
        <KeyboardShortcut
          combination="shift+up"
          availableDuringInputs={true}
          disabled={selectorDialog.open}
          onKeyDown={selectorDialog.openDialog}
        />
        <VStack gap={16} style={{ paddingBottom: 112 }}>
          <VStack gap={8}>
            <ReceiverAddressSelector
              formState={formState}
              onChange={handleChange}
              senderAddress={address}
            />
            {ecosystemMismatch ? (
              <UIText
                kind="caption/regular"
                color="var(--negative-500)"
                style={{ paddingLeft: 16 }}
              >
                {ecosystemMismatch}
              </UIText>
            ) : null}
          </VStack>
          <VStack gap={8}>
            {isNftMode ? (
              <>
                <InputNftPosition
                  formState={formState}
                  onChange={handleChange}
                  nftPosition={nftPosition}
                  onOpenSelector={selectorDialog.openDialog}
                />
                <NftPreview position={nftPosition} isLoading={nftLoading} />
              </>
            ) : (
              <InputPosition
                formState={formState}
                onChange={handleChange}
                position={position}
                resolvedInputAmount={resolvedInputAmount}
                onOpenSelector={selectorDialog.openDialog}
              />
            )}
          </VStack>
          {sendTransaction || sendDataLoading ? (
            <SendDetails
              inputChain={formState.inputChain}
              networks={networks}
              sendQuote={sendQuote}
              network={sendNetwork}
              evmTx={evmTx}
              address={address}
              gasPrices={gasPrices ?? null}
              configuration={toConfiguration(formState)}
              onConfigurationChange={(value) => {
                const partial = fromConfiguration(value);
                setUserFormState((state) => ({ ...state, ...partial }));
              }}
              userNonce={formState.nonce ?? null}
              onNonceChange={(nonce) =>
                handleChange('nonce', nonce ?? undefined)
              }
              customData={formState.data ?? null}
              onCustomDataChange={(value) => handleChange('data', value)}
              isLoading={sendDataLoading}
              receivedAmount={sendInputAmount}
              typedAmount={resolvedInputAmount}
              tokenSymbol={position?.fungible.symbol ?? null}
            />
          ) : null}
          <TransactionWarning warning={resolved.warning} />
          {resolved.unverified ? <UnverifiedWarning /> : null}
        </VStack>
        <AssetSelectorDialog
          open={selectorDialog.open}
          onClose={selectorDialog.closeDialog}
          defaultMode={defaultMode}
          address={address}
          positions={positions}
          networks={networks}
          nftChainsDistribution={nftChainsDistribution}
          isPortfolioLoading={!portfolioData}
          selectedNftId={formState.nftId ?? null}
          defaultTokensNetwork={lastTokensNetwork}
          defaultNftsNetwork={lastNftsNetwork}
          onTokensNetworkChange={setLastTokensNetwork}
          onNftsNetworkChange={setLastNftsNetwork}
          onSelectFungible={handleSelectFungible}
          onSelectNft={handleSelectNft}
        />
      </PageColumn>
      <PopoverToast
        ref={cancelToastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Send cancelled! No funds were sent
      </PopoverToast>
      <div className={styles.absoluteFooter}>
        <Spacer height={16} />
        {signMutation.isError &&
        !(signMutation.error instanceof QueueAbortError) ? (
          <VStack gap={0} style={{ paddingBottom: 8 }}>
            <ErrorMessage
              error={getError(signMutation.error)}
              hardwareError={getHardwareError(signMutation.error)}
            />
          </VStack>
        ) : null}
        {wallet && isReadonlyAccount(wallet) && !readonlyWallDisabled ? (
          <ReadonlySignButton wallet={wallet} />
        ) : (
          <SendButton
            address={address}
            formState={formState}
            transaction={clientTransaction}
            simulated={hasSimulated}
            signing={signMutation.isLoading}
            isPreparingTransaction={sendDataLoading}
            onSimulationCompleted={handleSimulationCompleted}
            onSign={() => handleSignTransaction(simulationResult)}
            onCancel={handleCancel}
            dangerTitle={resolved.dangerTitle ?? undefined}
          />
        )}
        <PageBottom />
      </div>
    </>
  );
}

function SendFormWrapper({
  address,
  ready,
}: {
  address: string;
  ready: boolean;
}) {
  useBackgroundKind(whiteBackgroundKind);
  const { currency } = useCurrency();
  const refetchInterval = usePositionsRefetchInterval(20000);
  const { data, isError } = useWalletSimplePositions(
    { address, currency },
    { source: useHttpClientSource() },
    { enabled: ready, refetchInterval }
  );

  const positions = data?.data;
  const { networks, isFetching } = useNetworks();

  if (isError) return null;
  if (!positions || !networks || isFetching) return <SendFormSkeleton />;

  return (
    <SendFormComponent
      address={address}
      positions={positions}
      networks={networks}
    />
  );
}

export function SendForm2() {
  const { singleAddress: address, ready } = useAddressParams();
  return <SendFormWrapper address={address} ready={ready} />;
}
