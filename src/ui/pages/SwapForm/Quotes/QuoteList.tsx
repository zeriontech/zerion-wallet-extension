import React, { useRef, useState } from 'react';
import type { Asset } from 'defi-sdk';
import omit from 'lodash/omit';
import { Quote } from 'src/shared/types/Quote';
import { HStack } from 'src/ui/ui-kit/HStack';
import TickIcon from 'jsx:src/ui/assets/check_double.svg';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ShieldIcon from 'jsx:src/ui/assets/shield.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { noValueDash } from 'src/ui/shared/typography';
import { baseToCommon } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { useTransactionFee } from '../../SendTransaction/TransactionConfiguration/useTransactionFee';
import { FeeDescription } from './FeeDescription';

function QuoteNetworkFee({
  transaction,
  chain,
  configuration,
}: {
  transaction: NonNullable<Quote['transaction']>;
  chain: Chain;
  configuration: CustomConfiguration;
}) {
  const { currency } = useCurrency();
  const { data: chainGasPrices = null } = useGasPrices(chain);
  const transactionFee = useTransactionFee({
    address: transaction.from,
    transaction: {
      ...omit(transaction, ['chain_id']),
      chainId: transaction.chain_id,
    },
    chain,
    onFeeValueCommonReady: null,
    networkFeeConfiguration: configuration.networkFee,
    chainGasPrices,
  });

  return (
    <span>
      {transactionFee.costs?.feeValueFiat
        ? formatCurrencyValue(
            transactionFee.costs?.feeValueFiat,
            'en',
            currency
          )
        : 'N/A'}
    </span>
  );
}

function Quote({
  quote,
  selected,
  bestRate,
  receiveAsset,
  configuration,
}: {
  quote: Quote;
  selected: boolean;
  bestRate: boolean;
  receiveAsset: Asset;
  configuration: CustomConfiguration;
}) {
  const { currency } = useCurrency();
  const chain = createChain(quote.output_chain);

  const receiveAmount = baseToCommon(
    quote.output_amount_estimation,
    getDecimals({ asset: receiveAsset, chain })
  ).times(receiveAsset.price?.value || 0);

  return (
    <HStack
      gap={0}
      alignItems="center"
      style={{
        gridTemplateColumns: '1fr 1fr 40px',
        padding: selected ? 11 : 10,
        border: selected
          ? '1px solid var(--primary)'
          : '2px solid var(--neutral-100)',
        borderRadius: 12,
        position: 'relative',
      }}
    >
      {bestRate ? (
        <UIText
          kind="caption/accent"
          style={{
            color: 'var(--white)',
            backgroundColor: selected ? 'var(--primary)' : 'var(--black)',
            padding: '2px 8px',
            borderRadius: 4,
            position: 'absolute',
            top: selected ? -7 : -8,
            right: selected ? -1 : -2,
            fontSize: '8px',
            lineHeight: '12px',
            letterSpacing: '0.2px',
          }}
        >
          BEST RATE
        </UIText>
      ) : null}
      <VStack gap={0} style={{ justifyItems: 'start' }}>
        <UIText
          kind="small/accent"
          color={selected ? 'var(--primary)' : 'var(--black)'}
        >
          {formatCurrencyValue(
            receiveAsset.price?.value ? receiveAmount : 'N/A',
            'en',
            currency
          )}
        </UIText>
        {quote.enough_allowance ? (
          <HStack
            gap={4}
            alignItems="center"
            style={{ color: selected ? 'var(--primary)' : 'var(--black)' }}
          >
            <TickIcon />
            <UIText kind="caption/regular" style={{ whiteSpace: 'nowrap' }}>
              Approved for {quote.contract_metadata?.name}
            </UIText>
          </HStack>
        ) : null}
      </VStack>
      <VStack gap={0} style={{ justifyItems: 'start' }}>
        <UIText
          kind="small/accent"
          color={selected ? 'var(--primary)' : 'var(--black)'}
        >
          {quote.transaction ? (
            <React.Suspense fallback={<CircleSpinner />}>
              <QuoteNetworkFee
                chain={chain}
                transaction={quote.transaction}
                configuration={configuration}
              />
            </React.Suspense>
          ) : (
            noValueDash
          )}
        </UIText>
        {quote.enough_allowance ? <div style={{ height: 16 }} /> : null}
      </VStack>
      <img
        src={quote.contract_metadata?.icon_url}
        alt={quote.contract_metadata?.name}
        width={32}
        height={32}
        title={quote.contract_metadata?.name}
      />
    </HStack>
  );
}

export function QuoteList({
  userPremiumTier,
  quotes,
  selectedQuote,
  onChange,
  onReset,
  receiveAsset,
  configuration,
}: {
  userPremiumTier: 'regular' | 'premium' | 'og';
  quotes: Quote[];
  selectedQuote: Quote | null;
  onChange: (quoteId: string | null) => void;
  onReset: () => void;
  receiveAsset: Asset;
  configuration: CustomConfiguration;
}) {
  const [selectedQuoteId, setSelectedQuoteId] = useState(
    selectedQuote?.contract_metadata?.id ?? null
  );
  const feeDescriptionDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
      <VStack gap={16}>
        <HStack gap={8} alignItems="center">
          <ShieldIcon style={{ color: 'var(--positive-500)' }} />
          <UIText kind="headline/h3">Best Available Rate</UIText>
        </HStack>

        <VStack gap={8}>
          <HStack gap={0} style={{ gridTemplateColumns: '1fr 1fr 40px' }}>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Min. Received
            </UIText>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Network fee
            </UIText>
          </HStack>
          <div style={{ maxHeight: 350, overflowY: 'auto', paddingTop: 8 }}>
            <VStack gap={8}>
              {quotes.map((quote, index) => (
                <UnstyledButton
                  onClick={() =>
                    setSelectedQuoteId(quote.contract_metadata?.id || null)
                  }
                >
                  <Quote
                    key={quote.contract_metadata?.id}
                    quote={quote}
                    selected={quote.contract_metadata?.id === selectedQuoteId}
                    bestRate={index === 0}
                    receiveAsset={receiveAsset}
                    configuration={configuration}
                  />
                </UnstyledButton>
              ))}
            </VStack>
          </div>
        </VStack>

        {userPremiumTier === 'premium' ? (
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Our platform fee is the{' '}
            <UnstyledButton
              style={{ color: 'var(--primary)' }}
              onClick={() => feeDescriptionDialogRef.current?.showModal()}
            >
              lowest among top wallets
            </UnstyledButton>{' '}
            and already included — keeping your swaps fast, safe, and secure.
          </UIText>
        ) : userPremiumTier === 'regular' && quotes.length ? (
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Our platform fee ({formatPercent(quotes[0].protocol_fee, 'en')}%) is
            already included — keeping your swaps fast, safe, and secure.
          </UIText>
        ) : null}
        <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
          <HStack
            gap={16}
            style={{ paddingTop: 16, gridTemplateColumns: '1fr 1fr' }}
          >
            <Button
              kind="neutral"
              size={44}
              onClick={onReset}
              value={DialogButtonValue.cancel}
            >
              Reset
            </Button>
            <Button
              kind="primary"
              size={44}
              onClick={() => onChange(selectedQuoteId)}
            >
              Save
            </Button>
          </HStack>
        </form>
      </VStack>
      {userPremiumTier === 'premium' && quotes.length ? (
        <BottomSheetDialog
          ref={feeDescriptionDialogRef}
          height="fit-content"
          containerStyle={{ paddingTop: 16 }}
          renderWhenOpen={() => (
            <FeeDescription
              userPremiumTier="premium"
              fee={quotes[0].protocol_fee}
            />
          )}
        />
      ) : null}
    </>
  );
}
