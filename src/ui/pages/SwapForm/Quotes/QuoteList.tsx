import React, { useRef } from 'react';
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
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { useTransactionFee } from '../../SendTransaction/TransactionConfiguration/useTransactionFee';
import { FeeDescription } from './FeeDescription';
import type { FeeTier } from './FeeTier';
import * as styles from './styles.module.css';

const QUOTE_GRIP_TEMPLATE_COLUMNS = '1fr 1fr 40px';

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
  receiveAsset,
  configuration,
}: {
  quote: Quote;
  receiveAsset: Asset;
  configuration: CustomConfiguration;
}) {
  const { currency } = useCurrency();
  const chain = createChain(quote.output_chain);

  const receiveAmount = getCommonQuantity({
    asset: receiveAsset,
    chain,
    baseQuantity: quote.output_amount_estimation,
  }).times(receiveAsset.price?.value || 0);

  return (
    <HStack
      gap={0}
      alignItems="center"
      style={{ gridTemplateColumns: QUOTE_GRIP_TEMPLATE_COLUMNS }}
    >
      <VStack gap={0} style={{ justifyItems: 'start' }}>
        <UIText kind="small/accent">
          {formatCurrencyValue(
            receiveAsset.price?.value ? receiveAmount : 'N/A',
            'en',
            currency
          )}
        </UIText>
        {quote.enough_allowance ? (
          <HStack gap={4} alignItems="center">
            <TickIcon />
            <UIText kind="caption/regular" style={{ whiteSpace: 'nowrap' }}>
              Approved for {quote.contract_metadata?.name}
            </UIText>
          </HStack>
        ) : null}
      </VStack>
      <VStack gap={0} style={{ justifyItems: 'start' }}>
        <UIText kind="small/accent">
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
  userFeeTier,
  quotes,
  selectedQuote,
  onChange,
  onReset,
  receiveAsset,
  configuration,
}: {
  userFeeTier: FeeTier | null;
  quotes: Quote[];
  selectedQuote: Quote | null;
  onChange: (quoteId: string | null) => void;
  onReset: () => void;
  receiveAsset: Asset;
  configuration: CustomConfiguration;
}) {
  const feeDescriptionDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const quoteId = formData.get('quoteId') as string | null;
          onChange(quoteId);
        }}
      >
        <VStack gap={16}>
          <HStack gap={8} alignItems="center">
            <ShieldIcon style={{ color: 'var(--positive-500)' }} />
            <UIText kind="headline/h3">Best Available Rate</UIText>
          </HStack>

          <VStack gap={8}>
            <HStack
              gap={0}
              style={{ gridTemplateColumns: QUOTE_GRIP_TEMPLATE_COLUMNS }}
            >
              <UIText kind="small/accent" color="var(--neutral-500)">
                Min. Received
              </UIText>
              <UIText kind="small/accent" color="var(--neutral-500)">
                Network fee
              </UIText>
            </HStack>
            <div style={{ maxHeight: 350, overflowY: 'auto', paddingTop: 8 }}>
              <VStack gap={8}>
                {quotes.map((quote, index) => {
                  const isSelected =
                    selectedQuote?.contract_metadata?.id ===
                    quote.contract_metadata?.id;
                  return (
                    <label className={styles.radio}>
                      <input
                        autoFocus={isSelected}
                        type="radio"
                        name="quoteId"
                        value={quote.contract_metadata?.id}
                        defaultChecked={isSelected}
                      />
                      {index === 0 ? (
                        <span className={styles.bestRateBadge}>BEST RATE</span>
                      ) : null}
                      <Quote
                        key={quote.contract_metadata?.id}
                        quote={quote}
                        receiveAsset={receiveAsset}
                        configuration={configuration}
                      />
                    </label>
                  );
                })}
              </VStack>
            </div>
          </VStack>

          {userFeeTier === 'premium' ? (
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Our platform fee is the{' '}
              <UnstyledButton
                type="button"
                style={{ color: 'var(--primary)' }}
                title="Zerion fees description"
                onClick={() => feeDescriptionDialogRef.current?.showModal()}
              >
                lowest among top wallets
              </UnstyledButton>{' '}
              and already included — keeping your swaps fast, safe, and secure.
            </UIText>
          ) : userFeeTier === 'regular' && quotes.length ? (
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Our platform fee ({formatPercent(quotes[0].protocol_fee, 'en')}%)
              is already included — keeping your swaps fast, safe, and secure.
            </UIText>
          ) : null}
          <HStack
            gap={16}
            style={{ paddingTop: 16, gridTemplateColumns: '1fr 1fr' }}
          >
            <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
              <Button
                kind="neutral"
                size={44}
                onClick={onReset}
                value={DialogButtonValue.cancel}
                style={{ width: '100%' }}
              >
                Reset
              </Button>
            </form>
            <Button kind="primary" size={44}>
              Save
            </Button>
          </HStack>
        </VStack>
      </form>
      {userFeeTier === 'premium' && quotes.length ? (
        <BottomSheetDialog
          ref={feeDescriptionDialogRef}
          height="fit-content"
          containerStyle={{ paddingTop: 16 }}
        >
          <FeeDescription userFeeTier="premium" fee={quotes[0].protocol_fee} />
        </BottomSheetDialog>
      ) : null}
    </>
  );
}
