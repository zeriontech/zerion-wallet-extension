import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigationType } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { Content } from 'react-area';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletSimplePositions } from 'src/modules/zerion-api/hooks/useWalletSimplePositions';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { PageColumn } from 'src/ui/components/PageColumn/PageColumn';
import { PageTop } from 'src/ui/components/PageTop/PageTop';
import { NavigationTitle } from 'src/ui/components/NavigationTitle/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink/UnstyledLink';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { Button } from 'src/ui/ui-kit/Button';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { useBackgroundKind } from 'src/ui/components/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SlippageSettings } from '../SwapForm/SlippageSettings';
import { fromConfiguration, toConfiguration } from '../SendForm/shared/helpers';
import { useSwapQuote } from './useSwapQuote';
import { useFormState } from './useFormState';
import { useFormPositions } from './useFormPositions';
import { MiddleLine, ReverseButton } from './ReverseButton';
import { InputPosition } from './InputPosition';
import { OutputPosition } from './OutputPosition';
import { QuoteDetails } from './QuoteDetails';
import { ReceiverAddressSelector } from './ReceiverAddressSelector';
import { TransactionWarning } from './TransactionWarning';
import { UKDisclaimer } from './UKDisclaimer';
import { SwapButton, type SimulationResult } from './SwapButton';
import { UnverifiedWarning } from './UnverifiedWarning/UnverifiedWarning';
import * as styles from './styles.module.css';

function SwapFormComponent({
  address,
  positions,
  networks,
}: {
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const [formState, setFormState, reverseTokens, setUserFormState] =
    useFormState({
      address,
      positions,
      networks,
    });

  const { inputPosition, outputPosition } = useFormPositions({
    formState,
    positions,
    networks,
  });

  const { quote, quotesQuery, setUserQuoteId } = useSwapQuote({
    address,
    formState,
    inputPosition,
    outputPosition,
  });

  const slippageDialog = useDialog2();
  const spendChain = formState.inputChain
    ? createChain(formState.inputChain)
    : null;

  const [simulationResult, setSimulationResult] =
    useState<SimulationResult>(null);
  const [hasSimulated, setHasSimulated] = useState(false);

  useEffect(() => {
    setSimulationResult(null);
    setHasSimulated(false);
  }, [
    formState.inputAmount,
    formState.inputFungibleId,
    formState.outputFungibleId,
    formState.inputChain,
  ]);

  useEffect(() => {
    if (!hasSimulated) return;
    const id = setTimeout(() => {
      setSimulationResult(null);
      setHasSimulated(false);
    }, 20_000);
    return () => clearTimeout(id);
  }, [hasSimulated]);

  const handleSignTransaction = () => {
    // eslint-disable-next-line no-console
    console.log('handleSignTransaction', {
      result: simulationResult,
      quote,
      address,
    });
  };

  const handleSimulationCompleted = (result: SimulationResult) => {
    const isUnverified =
      result == null ||
      (result.data?.warnings ?? []).some((w) => w.severity === 'Gray');
    if (isUnverified) {
      setSimulationResult(result);
      setHasSimulated(true);
      return;
    }
    setSimulationResult(result);
    handleSignTransaction();
  };

  const isUnverified = simulationResult?.data?.warnings.some(
    (w) => w.severity === 'Gray'
  );

  return (
    <>
      <Content name="navigation-bar-end">
        <HStack
          gap={8}
          alignItems="center"
          style={{ placeSelf: 'center end', marginRight: 16 - 8 }}
        >
          <Button
            kind="ghost"
            size={36}
            style={{ padding: 6 }}
            title="Swap settings"
            onClick={slippageDialog.openDialog}
          >
            <SettingsIcon style={{ display: 'block' }} />
          </Button>
          <UnstyledLink to="/wallet-select" title="Change Wallet">
            <WalletAvatar
              active={false}
              address={address}
              size={24}
              borderRadius={6}
            />
          </UnstyledLink>
        </HStack>
      </Content>
      <Dialog2
        open={slippageDialog.open}
        onClose={slippageDialog.closeDialog}
        title="Slippage"
        size="content"
        autoFocusInput={false}
      >
        {spendChain ? (
          <div style={{ padding: 16, paddingTop: 0 }}>
            <SlippageSettings
              chain={spendChain}
              includeAuto
              configuration={toConfiguration(formState)}
              onConfigurationChange={(value) => {
                const partial = fromConfiguration(value);
                setUserFormState((state) => ({ ...state, ...partial }));
                slippageDialog.closeDialog();
              }}
            />
          </div>
        ) : null}
      </Dialog2>
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Swap" />
        <VStack
          gap={24}
          style={{
            position: 'relative',
            flex: 1,
            alignContent: 'start',
            paddingBottom: 100,
          }}
        >
          <div className={styles.formContainer}>
            <InputPosition
              formState={formState}
              onChange={setFormState}
              position={inputPosition}
              positions={positions}
              networks={networks}
            />
            <MiddleLine />
            <ReverseButton onClick={reverseTokens} />
            <OutputPosition
              onChange={setFormState}
              position={outputPosition}
              outputAmount={quote?.outputAmount?.quantity ?? null}
              outputChain={formState.outputChain}
              positions={positions}
              networks={networks}
            />
          </div>
          <ReceiverAddressSelector
            formState={formState}
            onChange={setFormState}
            onBatchChange={setUserFormState}
            networks={networks}
          />
          <QuoteDetails
            quote={quote}
            quotesQuery={quotesQuery}
            formState={formState}
            networks={networks}
            onProviderChange={setUserQuoteId}
            onSlippageClick={slippageDialog.openDialog}
          />
          <TransactionWarning
            quote={quote}
            quotesQuery={quotesQuery}
            formState={formState}
          />
          {isUnverified ? <UnverifiedWarning /> : null}
          <UKDisclaimer />
        </VStack>
      </PageColumn>
      <div className={styles.absoluteFooter}>
        <Spacer height={16} />
        <SwapButton
          address={address}
          formState={formState}
          quote={quote}
          quotesQuery={quotesQuery}
          simulated={hasSimulated}
          onSimulationCompleted={handleSimulationCompleted}
          onSign={handleSignTransaction}
        />
        <PageBottom />
      </div>
    </>
  );
}

function FieldsetSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <VStack gap={6} style={{ width: '100%' }}>
        <HStack gap={16} justifyContent="space-between">
          <div className={styles.skeleton} style={{ width: 64, height: 16 }} />
          <div />
        </HStack>
        <HStack gap={16} justifyContent="space-between" alignItems="center">
          <HStack gap={8} alignItems="center">
            <div
              className={styles.skeletonCircle}
              style={{ width: 32, height: 32 }}
            />
            <div
              className={styles.skeleton}
              style={{ width: 72, height: 24 }}
            />
          </HStack>
          <div className={styles.skeleton} style={{ width: 80, height: 24 }} />
        </HStack>
        <HStack gap={16} justifyContent="space-between">
          <div className={styles.skeleton} style={{ width: 96, height: 16 }} />
          <div className={styles.skeleton} style={{ width: 56, height: 16 }} />
        </HStack>
      </VStack>
    </div>
  );
}

function SwapFormSkeleton() {
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title="Swap" />
      <VStack
        gap={24}
        style={{ position: 'relative', flex: 1, alignContent: 'start' }}
      >
        <div className={styles.formContainer}>
          <FieldsetSkeleton />
          <MiddleLine />
          <div className={styles.reverseButton}>
            <div
              className={styles.skeletonCircle}
              style={{ width: 20, height: 20 }}
            />
          </div>
          <FieldsetSkeleton />
        </div>
      </VStack>
    </PageColumn>
  );
}

function SwapFormError() {
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title="Swap" />
      <div>Error loading swap form</div>
    </PageColumn>
  );
}

/** Sets initial chainInput to last used chain for current address */
function SwapFormWrapper({
  address,
  ready,
}: {
  address: string;
  ready: boolean;
}) {
  const { currency } = useCurrency();
  const navigationType = useNavigationType();
  const isBackOrForward = navigationType === 'POP';
  const [searchParams, setSearchParams] = useSearchParams();
  const [prepared, setPrepared] = useState(
    isBackOrForward || searchParams.has('inputChain')
  );
  const { data: lastUsedChain, isFetchedAfterMount } = useQuery({
    enabled: ready && !prepared,
    // Avoid using stale value. Leaving form and coming back should use new value instantly
    staleTime: 0,
    queryKey: ['wallet/getLastSwapChainByAddress', address],
    queryFn: () => walletPort.request('getLastSwapChainByAddress', { address }),
  });

  const { data, isError } = useWalletSimplePositions(
    { address, currency },
    { source: useHttpClientSource() },
    { enabled: ready }
  );

  const positions = data?.data;

  const { networks, isFetching } = useNetworks();

  useEffect(() => {
    if (prepared || !isFetchedAfterMount) {
      return;
    }
    if (lastUsedChain) {
      searchParams.set('inputChain', lastUsedChain);
      setSearchParams(searchParams, { replace: true });
    }
    setPrepared(true);
  }, [
    isFetchedAfterMount,
    lastUsedChain,
    prepared,
    searchParams,
    setSearchParams,
  ]);

  return isError ? (
    <SwapFormError />
  ) : prepared && positions && networks && !isFetching ? (
    <SwapFormComponent
      address={address}
      positions={positions}
      networks={networks}
    />
  ) : (
    <SwapFormSkeleton />
  );
}

export function SwapForm2() {
  useBackgroundKind({ kind: 'white' });
  const { preferences } = usePreferences();
  const { singleAddress: address, ready } = useAddressParams();
  if (preferences?.testnetMode?.on) {
    return <Navigate to="/" />;
  }
  return <SwapFormWrapper address={address} ready={ready} />;
}
