import React, { useRef } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { SlidingRectangle } from 'src/ui/components/SlidingRectangle';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { noValueDash } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { getQuotesErrorMessage } from '../../SwapForm/Quotes/getQuotesErrorMessage';
import { QuoteList } from '../QuoteList';
import type { BridgeFormState } from '../types';
import * as styles from '../../SwapForm/Quotes/styles.module.css';

export function BridgeLine({
  sortType,
  quotesData,
  selectedQuote,
  onQuoteIdChange,
  onSortTypeChange,
}: {
  sortType: BridgeFormState['sort'];
  quotesData: QuotesData<Quote2>;
  selectedQuote: Quote2 | null;
  onQuoteIdChange: (quoteId: string | null) => void;
  onSortTypeChange: (sortType: BridgeFormState['sort']) => void;
}) {
  const { isLoading, error, quotes } = quotesData;
  const quotesDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const feeAsset = selectedQuote?.bridgeFee?.fungible;
  const feeAmount = selectedQuote?.bridgeFee?.amount;

  return (
    <>
      <HStack
        gap={12}
        justifyContent="space-between"
        alignItems="center"
        style={{
          visibility:
            !isLoading && !selectedQuote && !error ? 'hidden' : undefined,
        }}
      >
        <HStack gap={8} alignItems="center">
          <UIText kind="small/regular">Bridge</UIText>
          <div
            className={quotesData.done ? styles.iconCountdown : undefined}
            style={{ position: 'relative' }}
            title="Quotes auto-refresh every 20 seconds"
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--white)',
                position: 'relative',
              }}
            />
          </div>
        </HStack>
        <span>
          {isLoading && !selectedQuote ? (
            <span style={{ color: 'var(--neutral-500)' }}>
              Fetching offers...
            </span>
          ) : selectedQuote ? (
            <UnstyledButton
              style={{ display: 'flex' }}
              onClick={() => quotesDialogRef.current?.showModal()}
              title="Select quote"
            >
              <HStack
                gap={4}
                style={{
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {selectedQuote.contractMetadata?.iconUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      width: 20,
                      height: 20,
                    }}
                  >
                    <SlidingRectangle
                      size={20}
                      src={selectedQuote.contractMetadata.iconUrl}
                      render={(src, index) => (
                        <div
                          className={
                            quotesData.isLoading
                              ? styles.iconLoading
                              : undefined
                          }
                        >
                          <img
                            title={selectedQuote.contractMetadata?.name}
                            style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              zIndex: index,
                            }}
                            src={src}
                            // The alt here may be from a sibling image, but hopefully it doesn't matter
                            alt={`${selectedQuote.contractMetadata?.name} logo`}
                          />
                        </div>
                      )}
                    />
                  </div>
                ) : null}

                <HStack gap={4} alignItems="center">
                  <UIText kind="small/accent" color="var(--primary)">
                    {selectedQuote?.time
                      ? `~${formatSeconds(Number(selectedQuote.time))}`
                      : noValueDash}
                  </UIText>
                  <UIText kind="small/accent" color="var(--primary)">
                    ·
                  </UIText>
                  {feeAsset && feeAmount?.usdValue ? (
                    <HStack gap={4} alignItems="center">
                      <UIText kind="small/accent" color="var(--primary)">
                        {formatCurrencyValue(
                          feeAmount.usdValue,
                          'en',
                          feeAmount.currency
                        )}
                      </UIText>
                      <UIText kind="small/accent" color="var(--primary)">
                        ·
                      </UIText>
                      <TokenIcon
                        size={16}
                        src={feeAsset.iconUrl}
                        symbol={feeAsset.symbol}
                      />
                      <UIText color="var(--black)" kind="small/accent">
                        {feeAsset.symbol}
                      </UIText>
                    </HStack>
                  ) : (
                    <UIText
                      kind="small/accent"
                      style={{
                        background:
                          'linear-gradient(113deg, #20DBE7 6.71%, #4B7AEF 58.69%, #BC29EF 102.67%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Free
                    </UIText>
                  )}
                </HStack>
              </HStack>
            </UnstyledButton>
          ) : error ? (
            <UIText kind="small/regular" color="var(--notice-600)">
              {getQuotesErrorMessage(quotesData)}
            </UIText>
          ) : null}
        </span>
      </HStack>
      <BottomSheetDialog
        ref={quotesDialogRef}
        height="fit-content"
        renderWhenOpen={() => (
          <QuoteList
            quotes={quotes}
            isLoading={quotesData.isLoading}
            selectedQuote={selectedQuote}
            onChange={onQuoteIdChange}
            onReset={() => onQuoteIdChange(null)}
            sortType={sortType}
            onSortTypeChange={onSortTypeChange}
          />
        )}
      />
    </>
  );
}
