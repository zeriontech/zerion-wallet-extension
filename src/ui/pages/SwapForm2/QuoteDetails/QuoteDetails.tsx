import React, { useRef, useState } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { noValueDash } from 'src/ui/shared/typography';
import { getSlippageOptions } from 'src/ui/pages/SwapForm/SlippageSettings/getSlippageOptions';
import type { SwapFormState2 } from '../types';
import { ProviderSelector } from './ProviderSelector';
import * as styles from './QuoteDetails.module.css';

function DetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <UIText kind="small/regular">{label}</UIText>
      <UIText kind="small/accent">{value}</UIText>
    </HStack>
  );
}

function formatNetworkFee(quote: Quote2): React.ReactNode {
  const { networkFee } = quote;
  if (networkFee?.free) {
    return 'Free';
  }
  if (networkFee?.amount?.value != null) {
    return formatCurrencyValueExtra(
      networkFee.amount.value,
      'en',
      networkFee.amount.currency,
      { zeroRoundingFallback: 0.01 }
    );
  }
  if (networkFee?.amount?.quantity) {
    return formatTokenValue(
      networkFee.amount.quantity,
      networkFee.fungible?.symbol ?? ''
    );
  }
  return noValueDash;
}

function getSlippageDisplay(formState: SwapFormState2): string {
  const userSlippage =
    formState.slippage != null && formState.slippage !== 'auto'
      ? Number(formState.slippage)
      : null;

  const chain = createChain(formState.inputChain);
  const { slippagePercent } = getSlippageOptions({ chain, userSlippage });

  if (userSlippage != null) {
    return `${slippagePercent}%`;
  }
  return `Auto \u00b7 ${slippagePercent}%`;
}

export function QuoteDetails({
  quote,
  quotesQuery,
  formState,
  networks,
  onProviderChange,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
  networks: Networks;
  onProviderChange: (quoteId: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const providerDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  if (!quotesQuery.isLoading && quote == null) {
    return null;
  }

  const chain = createChain(formState.inputChain);
  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getByNetworkId(chain)?.icon_url;

  return (
    <>
      <VStack gap={0}>
        <div className={styles.detailsContainer}>
          <VStack gap={16}>
            <DetailRow
              label="Network Fee"
              value={quote ? formatNetworkFee(quote) : noValueDash}
            />
            {isExpanded ? (
              <>
                <DetailRow
                  label="Slippage"
                  value={getSlippageDisplay(formState)}
                />
                <DetailRow
                  label="Provider"
                  value={
                    quote ? (
                      <UnstyledButton
                        onClick={() => providerDialogRef.current?.showModal()}
                        style={{ display: 'flex' }}
                      >
                        <HStack gap={8} alignItems="center">
                          {quote.contractMetadata.iconUrl ? (
                            <img
                              src={quote.contractMetadata.iconUrl}
                              alt={quote.contractMetadata.name}
                              width={16}
                              height={16}
                              style={{ borderRadius: 4 }}
                            />
                          ) : null}
                          <UIText kind="small/accent">
                            {quote.contractMetadata.name}
                          </UIText>
                          <ChevronRightIcon
                            style={{
                              display: 'block',
                              width: 20,
                              height: 20,
                              color: 'var(--neutral-400)',
                            }}
                          />
                        </HStack>
                      </UnstyledButton>
                    ) : (
                      noValueDash
                    )
                  }
                />
                <DetailRow
                  label="Network"
                  value={
                    <HStack gap={8} alignItems="center">
                      <NetworkIcon
                        src={chainIconUrl}
                        name={chainName}
                        size={16}
                        style={{ borderRadius: 4 }}
                      />
                      <UIText kind="small/accent">{chainName}</UIText>
                    </HStack>
                  }
                />
                <DetailRow
                  label={
                    <HStack gap={0} alignItems="center">
                      <span>Zerion Fee</span>
                      <InfoIcon
                        style={{
                          width: 20,
                          height: 20,
                          color: 'var(--neutral-500)',
                        }}
                      />
                    </HStack>
                  }
                  value={
                    quote
                      ? `${formatPercent(quote.protocolFee.percentage, 'en')}%`
                      : noValueDash
                  }
                />
              </>
            ) : null}
          </VStack>
        </div>
        <div className={styles.detailsToggleWrapper}>
          <UnstyledButton
            className={styles.detailsToggle}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <UIText
              kind="caption/regular"
              style={{ fontWeight: 600, color: 'var(--neutral-500)' }}
            >
              Details
            </UIText>
            <ChevronDownIcon
              className={isExpanded ? styles.chevronUp : undefined}
              style={{
                display: 'block',
                width: 16,
                height: 16,
                color: 'var(--neutral-500)',
              }}
            />
          </UnstyledButton>
        </div>
      </VStack>

      {quotesQuery.quotes?.length ? (
        <BottomSheetDialog
          ref={providerDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <ProviderSelector
              quotes={quotesQuery.quotes!}
              selectedQuote={quote}
              onSelect={onProviderChange}
            />
          )}
        />
      ) : null}
    </>
  );
}
