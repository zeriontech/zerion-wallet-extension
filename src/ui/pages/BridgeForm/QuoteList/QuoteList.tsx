import type { CustomConfiguration } from '@zeriontech/transactions';
import { useAssetsPrices, type Asset } from 'defi-sdk';
import omit from 'lodash/omit';
import React, { useId, useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import type { Quote } from 'src/shared/types/Quote';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { QuoteSortType } from 'src/ui/shared/requests/useQuotes';
import { noValueDash } from 'src/ui/shared/typography';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useTransactionFee } from '../../SendTransaction/TransactionConfiguration/useTransactionFee';
import { getBridgeFeeValueFiat } from '../shared/getBridgeFeeValueFiat';
import * as styles from './styles.module.css';

const QUOTE_GRID_TEMPLATE_COLUMNS = '30px 3fr 3fr 2fr 2fr';

function GasFee({
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

  return transactionFee.costs?.feeValueFiat
    ? formatCurrencyValue(transactionFee.costs?.feeValueFiat, 'en', currency)
    : 'N/A';
}

function BridgeFee({ chain, quote }: { chain: Chain; quote: Quote }) {
  const { currency } = useCurrency();

  const { value: feeAssetValue } = useAssetsPrices({
    asset_codes: [quote.bridge_fee_asset_id || ''],
    currency,
  });

  const feeAssetId = quote.bridge_fee_asset_id;
  const feeAsset = feeAssetId ? feeAssetValue?.[feeAssetId] : undefined;
  const feePriceValue = useMemo(
    () =>
      feeAsset
        ? getBridgeFeeValueFiat({
            quote,
            chain,
            asset: feeAsset,
          })
        : null,
    [feeAsset, quote, chain]
  );

  return feeAsset && feePriceValue ? (
    <HStack gap={4} alignItems="center" justifyContent="center">
      <UIText kind="small/regular">
        {formatPriceValue(feePriceValue, 'en', currency)}
      </UIText>
      <UIText kind="small/regular">·</UIText>
      <UIText kind="small/regular">{feeAsset.symbol}</UIText>
    </HStack>
  ) : (
    <UIText
      kind="small/regular"
      style={{
        textAlign: 'center',
        background:
          'linear-gradient(113deg, #20DBE7 6.71%, #4B7AEF 58.69%, #BC29EF 102.67%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Free
    </UIText>
  );
}

function QuoteListItem({
  configuration,
  spendChain,
  receiveAsset,
  quote,
}: {
  configuration: CustomConfiguration;
  spendChain: Chain;
  receiveAsset: Asset;
  quote: Quote;
}) {
  const { currency } = useCurrency();
  const chain = createChain(quote.output_chain);

  const receiveAmount = receiveAsset.price?.value
    ? getCommonQuantity({
        asset: receiveAsset,
        chain,
        baseQuantity: quote.output_amount_estimation,
      }).times(receiveAsset.price.value)
    : null;

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{ gridTemplateColumns: QUOTE_GRID_TEMPLATE_COLUMNS }}
    >
      <img
        src={quote.contract_metadata?.icon_url}
        alt={quote.contract_metadata?.name}
        width={20}
        height={20}
        title={quote.contract_metadata?.name}
      />
      <UIText kind="small/regular" style={{ textAlign: 'center' }}>
        {receiveAmount
          ? formatCurrencyValue(receiveAmount, 'en', currency)
          : 'N/A'}
      </UIText>
      <BridgeFee chain={spendChain} quote={quote} />
      <UIText kind="small/regular" style={{ textAlign: 'center' }}>
        {quote.transaction ? (
          <React.Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CircleSpinner />
              </div>
            }
          >
            <GasFee
              chain={chain}
              transaction={quote.transaction}
              configuration={configuration}
            />
          </React.Suspense>
        ) : (
          noValueDash
        )}
      </UIText>
      <UIText kind="small/regular" style={{ textAlign: 'right' }}>
        ~{formatSeconds(Number(quote.seconds_estimation))}
      </UIText>
    </HStack>
  );
}

export function QuoteList({
  configuration,
  spendChain,
  receiveAsset,
  quotes,
  selectedQuote,
  onQuoteIdChange,
  sortType,
  onChangeSortType,
}: {
  configuration: CustomConfiguration;
  spendChain: Chain;
  receiveAsset: Asset;
  quotes: Quote[];
  selectedQuote: Quote | null;
  onQuoteIdChange: (quoteId: string | null) => void;
  sortType: QuoteSortType;
  onChangeSortType: (sortType: QuoteSortType) => void;
}) {
  const formId = useId();

  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
      <VStack gap={24} style={{ marginTop: 24 }}>
        <SegmentedControlGroup childrenLayout="spread-children-evenly">
          <SegmentedControlRadio
            name="sortType"
            value="amount"
            checked={sortType === 'amount'}
            onChange={() => onChangeSortType('amount')}
          >
            Max Received
          </SegmentedControlRadio>
          <SegmentedControlRadio
            name="sortType"
            value="time"
            checked={sortType === 'time'}
            onChange={() => onChangeSortType('time')}
          >
            Fastest Transfer
          </SegmentedControlRadio>
        </SegmentedControlGroup>
        <VStack gap={16}>
          <HStack
            gap={4}
            style={{
              textAlign: 'center',
              padding: '0 12px',
              gridTemplateColumns: QUOTE_GRID_TEMPLATE_COLUMNS,
            }}
          >
            <div aria-hidden={true} />
            <UIText kind="caption/accent" color="var(--neutral-600)">
              Receive
            </UIText>
            <UIText kind="caption/accent" color="var(--neutral-600)">
              Bridge Fee
            </UIText>
            <UIText kind="caption/accent" color="var(--neutral-600)">
              Gas Fee
            </UIText>
            <UIText
              kind="caption/accent"
              color="var(--neutral-600)"
              style={{ textAlign: 'right' }}
            >
              Time
            </UIText>
          </HStack>
          <form
            id={formId}
            method="dialog"
            onSubmit={(event) => {
              event.stopPropagation();
              const formData = new FormData(event.currentTarget);
              const quoteId = formData.get('quoteId') as string | null;
              if (quoteId || !selectedQuote) {
                onQuoteIdChange(quoteId);
              }
            }}
            style={{ maxHeight: 350, overflowY: 'auto' }}
          >
            <VStack gap={12}>
              {quotes.map((quote) => {
                const isSelected =
                  selectedQuote?.contract_metadata?.id ===
                  quote.contract_metadata?.id;
                return (
                  <label
                    className={styles.radio}
                    key={quote.contract_metadata?.id}
                  >
                    <input
                      autoFocus={isSelected}
                      type="radio"
                      name="quoteId"
                      value={quote.contract_metadata?.id}
                      defaultChecked={isSelected}
                    />
                    <QuoteListItem
                      key={quote.contract_metadata?.id}
                      configuration={configuration}
                      receiveAsset={receiveAsset}
                      spendChain={spendChain}
                      quote={quote}
                    />
                  </label>
                );
              })}
            </VStack>
          </form>
        </VStack>
        <Button kind="primary" size={48} form={formId}>
          Save
        </Button>
      </VStack>
    </>
  );
}
