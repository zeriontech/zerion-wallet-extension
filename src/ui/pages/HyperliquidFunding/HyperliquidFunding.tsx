import React, { useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { useBackgroundKind } from 'src/ui/components/Background';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useWalletSimplePositions } from 'src/modules/zerion-api/hooks/useWalletSimplePositions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { useQuotesV2 } from 'src/ui/shared/requests/useQuotes';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { emitter } from 'src/ui/shared/events';
import { pickPerpsDepositQuote } from 'src/ui/pages/Perps/PerpsDeposit/pickPerpsDepositQuote';
import { getFundingFeeSummary } from 'src/modules/hyperliquid/funding/fundingFees';

const HYPERCORE_CHAIN_ID = 'hypercore';
const HYPERCORE_USDC_FUNGIBLE_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const DEPOSIT_SLIPPAGE = '0.5';
const ETHEREUM_CHAIN_ID = 'ethereum';

function abbreviateChain(chainId: string) {
  if (chainId.length <= 12) return chainId;
  return `${chainId.slice(0, 6)}…${chainId.slice(-4)}`;
}

function FundingFeeRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      style={{ padding: '10px 16px', borderTop: '1px solid var(--neutral-200)' }}
    >
      <UIText kind="small/regular" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText kind="small/accent">{value}</UIText>
    </HStack>
  );
}

export function HyperliquidFunding() {
  useBackgroundKind({ kind: 'white' });
  const navigate = useNavigate();
  const { singleAddress, ready } = useAddressParams();
  const { currency } = useCurrency();
  const { networks } = useNetworks();
  const httpSource = useHttpClientSource();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const hasEmittedShown = useRef(false);

  const { data, isLoading } = useWalletSimplePositions(
    { address: singleAddress, currency },
    { source: httpSource },
    { enabled: ready },
  );

  const positions = useMemo(() => {
    const items = (data?.data ?? []).filter((position) => !position.amount.encrypted);
    const bridgeable = items.filter((position) => {
      const network = networks?.getByNetworkId(createChain(position.chain.id));
      return network?.flags.supportsBridging || position.chain.id === ETHEREUM_CHAIN_ID;
    });
    return [...bridgeable].sort(
      (a, b) => Number(b.amount.usdValue ?? 0) - Number(a.amount.usdValue ?? 0),
    );
  }, [data, networks]);

  const selected = positions.find((position) => position.id === selectedId) ?? positions[0] ?? null;

  useEffect(() => {
    if (!hasEmittedShown.current && ready && !isLoading) {
      hasEmittedShown.current = true;
      emitter.emit('hyperliquidFundingPrompt', { action: 'shown' });
    }
  }, [ready, isLoading]);

  const price = selected?.fungible.meta.price ?? null;
  const amountUsd =
    selected && amount && price != null
      ? new BigNumber(amount).multipliedBy(price).toNumber()
      : null;

  const formState = useMemo(
    () => ({
      inputChain: selected?.chain.id ?? '',
      inputFungibleId: selected?.fungible.id ?? '',
      inputAmount: amount,
      outputChain: HYPERCORE_CHAIN_ID,
      outputFungibleId: HYPERCORE_USDC_FUNGIBLE_ID,
      to: singleAddress,
      slippage: DEPOSIT_SLIPPAGE,
    }),
    [selected, amount, singleAddress],
  );

  const quotesQuery = useQuotesV2({
    address: singleAddress,
    currency,
    formState,
    enabled: Boolean(selected) && Number(amount) > 0,
    context: 'Bridge',
    pathname: window.location.pathname,
    inputFiatValue: amountUsd,
  });
  const quote = pickPerpsDepositQuote(quotesQuery.quotes);
  const fees = getFundingFeeSummary(quote);

  const dismiss = () => {
    emitter.emit('hyperliquidFundingPrompt', {
      action: 'dismissed',
      selected_chain: selected?.chain.id ?? null,
      selected_symbol: selected?.fungible.symbol ?? null,
      amount_usd: amountUsd,
      fees_usd: fees.totalFeeUsd,
    });
    window.close();
  };

  const deposit = () => {
    if (!selected || !amount) return;
    emitter.emit('hyperliquidFundingPrompt', {
      action: 'clicked_deposit',
      selected_chain: selected.chain.id,
      selected_symbol: selected.fungible.symbol,
      amount_usd: amountUsd,
      fees_usd: fees.totalFeeUsd,
    });
    const params = new URLSearchParams({
      inputChain: selected.chain.id,
      inputFungibleId: selected.fungible.id,
      inputAmount: amount,
      inputKind: 'token',
    });
    navigate(`/perps/deposit?${params.toString()}`);
  };

  if (!ready) return null;

  return (
    <PageColumn>
      <NavigationTitle title="Fund Hyperliquid" />
      <PageTop />
      <VStack gap={16}>
        <VStack gap={4}>
          <UIText kind="headline/h2">Fund your Hyperliquid account</UIText>
          <UIText kind="body/regular" color="var(--neutral-600)">
            Your Hyperliquid balance is $0. Move funds from any chain in one step.
          </UIText>
        </VStack>

        {isLoading ? (
          <UIText kind="small/regular" color="var(--neutral-500)">
            Loading your balances…
          </UIText>
        ) : positions.length === 0 ? (
          <Frame style={{ padding: 16 }}>
            <UIText kind="body/regular" color="var(--neutral-600)">
              No bridgeable balances in this wallet.
            </UIText>
          </Frame>
        ) : (
          <VStack gap={8}>
            {positions.slice(0, 5).map((position: FungiblePosition) => {
              const isSelected = selected?.id === position.id;
              return (
                <UnstyledButton
                  key={position.id}
                  onClick={() => {
                    setSelectedId(position.id);
                    setAmount('');
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: isSelected
                      ? '2px solid var(--primary)'
                      : '1px solid var(--neutral-200)',
                    textAlign: 'start',
                  }}
                >
                  <HStack gap={12} alignItems="center" justifyContent="space-between">
                    <HStack gap={12} alignItems="center">
                      <TokenIcon
                        src={position.fungible.iconUrl}
                        symbol={position.fungible.symbol}
                        size={32}
                      />
                      <VStack gap={0}>
                        <UIText kind="body/accent">{position.fungible.symbol}</UIText>
                        <UIText kind="caption/regular" color="var(--neutral-500)">
                          {abbreviateChain(position.chain.name ?? position.chain.id)}
                        </UIText>
                      </VStack>
                    </HStack>
                    <UIText kind="body/accent">
                      {formatCurrencyValue(Number(position.amount.usdValue ?? 0), 'en', currency)}
                    </UIText>
                  </HStack>
                </UnstyledButton>
              );
            })}
          </VStack>
        )}

        {selected ? (
          <Frame>
            <VStack gap={0}>
              <HStack
                gap={12}
                alignItems="center"
                justifyContent="space-between"
                style={{ padding: '12px 16px' }}
              >
                <UIText kind="small/regular" color="var(--neutral-600)">
                  Amount
                </UIText>
                <HStack gap={8} alignItems="center" style={{ minWidth: 0 }}>
                  <Input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    style={{ width: 120, textAlign: 'end' }}
                  />
                  <UIText kind="small/accent">{selected.fungible.symbol}</UIText>
                  <Button kind="text-primary" onClick={() => setAmount(selected.amount.quantity)}>
                    Max
                  </Button>
                </HStack>
              </HStack>
              <FundingFeeRow label="Arrives as" value="USDC on Hyperliquid" />
              {quote ? (
                <>
                  <FundingFeeRow
                    label="You receive"
                    value={fees.outputUsdc == null ? '—' : `${fees.outputUsdc.toFixed(2)} USDC`}
                  />
                  {fees.provider ? <FundingFeeRow label="Route" value={fees.provider} /> : null}
                  {fees.networkFeeUsd != null ? (
                    <FundingFeeRow
                      label="Network fee"
                      value={formatCurrencyValue(fees.networkFeeUsd, 'en', currency)}
                    />
                  ) : null}
                  {fees.bridgeFeeUsd != null ? (
                    <FundingFeeRow
                      label="Bridge fee"
                      value={formatCurrencyValue(fees.bridgeFeeUsd, 'en', currency)}
                    />
                  ) : null}
                  {fees.protocolFeeUsd != null && fees.protocolFeeUsd > 0 ? (
                    <FundingFeeRow
                      label="Swap fee"
                      value={formatCurrencyValue(fees.protocolFeeUsd, 'en', currency)}
                    />
                  ) : null}
                  {fees.totalFeeUsd != null ? (
                    <FundingFeeRow
                      label="Total fees"
                      value={formatCurrencyValue(fees.totalFeeUsd, 'en', currency)}
                    />
                  ) : null}
                </>
              ) : (
                <FundingFeeRow
                  label="Fees"
                  value={
                    quotesQuery.isLoading
                      ? 'Fetching route…'
                      : Number(amount) > 0
                        ? 'No route for this amount'
                        : 'Shown before you sign'
                  }
                />
              )}
            </VStack>
          </Frame>
        ) : null}

        <UIText kind="caption/regular" color="var(--neutral-600)">
          Funds may take a few minutes to settle on Hyperliquid.
        </UIText>
      </VStack>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 'auto',
          paddingBottom: 32,
          paddingTop: 16,
        }}
      >
        <Button kind="regular" onClick={dismiss}>
          Skip
        </Button>
        <Button
          onClick={deposit}
          disabled={!selected || !amount || Number(amount) <= 0 || quotesQuery.isLoading}
        >
          {amountUsd != null && amountUsd > 0
            ? `Deposit ${formatCurrencyValue(amountUsd, 'en', currency)}`
            : 'Deposit'}
        </Button>
      </div>
      <PageBottom />
    </PageColumn>
  );
}
