import React, { useMemo, useRef } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { SlidingRectangle } from 'src/ui/components/SlidingRectangle';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { Quote2 } from 'src/shared/types/Quote';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { getQuotesErrorMessage } from './getQuotesErrorMessage';
import { FeeDescription } from './FeeDescription';
import { QuoteList } from './QuoteList';
import type { FeeTier } from './FeeTier';
import * as styles from './styles.module.css';

export function RateLine({
  quotesData,
  selectedQuote,
  onQuoteIdChange,
}: {
  quotesData: QuotesData<Quote2>;
  selectedQuote: Quote2 | null;
  onQuoteIdChange: (quoteId: string | null) => void;
}) {
  const { data: config } = useFirebaseConfig(['quotes_refetch_interval']);
  const refetchInterval = config?.quotes_refetch_interval ?? 20000;
  const { pathname } = useLocation();
  const feeDescriptionDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const quotesDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const { isLoading, error, quotes } = quotesData;

  const { data: firebaseData } = useFirebaseConfig(['fee_comparison_config']);
  const zerionPremiumFee = useMemo(() => {
    return (
      firebaseData?.fee_comparison_config.find((item) => item.isZerionFee)
        ?.fee ?? null
    );
  }, [firebaseData?.fee_comparison_config]);

  const userFeeTier: FeeTier | null = !selectedQuote
    ? null
    : !selectedQuote.protocolFee.percentage
    ? 'og'
    : zerionPremiumFee != null
    ? selectedQuote.protocolFee.percentage === zerionPremiumFee
      ? 'premium'
      : 'regular'
    : null;

  return (
    <>
      <HStack
        gap={8}
        justifyContent="space-between"
        style={{
          visibility:
            !isLoading && !selectedQuote && !error ? 'hidden' : undefined,
        }}
      >
        <HStack gap={4} alignItems="center">
          <UIText kind="small/regular">Rate</UIText>
          {userFeeTier ? (
            <UnstyledButton
              title="Zerion fees description"
              onClick={() => {
                feeDescriptionDialogRef.current?.showModal();
                emitter.emit('buttonClicked', {
                  buttonScope: 'General',
                  buttonName: 'Rate Tooltip',
                  pathname,
                });
              }}
            >
              <QuestionHintIcon
                role="decoration"
                style={{
                  width: 16,
                  height: 16,
                  display: 'block',
                  color: 'var(--neutral-500)',
                }}
              />
            </UnstyledButton>
          ) : null}
          <div
            className={quotesData.done ? styles.iconCountdown : undefined}
            style={{
              position: 'relative',
              ['--countdown-duration' as string]: `${refetchInterval}ms`,
            }}
            title={`Quotes auto-refresh every ${
              refetchInterval / 1000
            } seconds`}
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
              title="Select quote"
              onClick={() => quotesDialogRef.current?.showModal()}
            >
              <HStack
                // in design it's 4, but design has circle images
                gap={8}
                style={{
                  // Prevent formatted rate text from changing width
                  // when the values change. This way, the animated images stay in one place
                  fontVariantNumeric: 'tabular-nums',
                }}
                alignItems="center"
              >
                {selectedQuote.contractMetadata?.iconUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      width: 20,
                      height: 20,
                      // overflow: 'hidden',
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
                {selectedQuote.rate ? (
                  <UIText kind="small/accent" color="var(--primary)">
                    {`${selectedQuote.rate[0].value} ${
                      selectedQuote.rate[0].symbol
                    } = ${formatTokenValue(
                      selectedQuote.rate[1].value,
                      selectedQuote.rate[1].symbol
                    )}`}
                  </UIText>
                ) : (
                  <span>
                    {selectedQuote.contractMetadata?.name ?? 'unknown'}
                  </span>
                )}
              </HStack>
            </UnstyledButton>
          ) : error ? (
            <UIText kind="small/regular" color="var(--notice-600)">
              {getQuotesErrorMessage(quotesData)}
            </UIText>
          ) : null}
        </span>
      </HStack>
      {userFeeTier && selectedQuote ? (
        <BottomSheetDialog
          ref={feeDescriptionDialogRef}
          height="fit-content"
          containerStyle={{ paddingTop: 16 }}
          renderWhenOpen={() => (
            <>
              <FeeDescription
                userFeeTier={userFeeTier}
                fee={selectedQuote.protocolFee.percentage}
              />
              <DialogCloseButton
                style={{ position: 'absolute', top: 8, right: 8 }}
              />
            </>
          )}
        />
      ) : null}
      {quotes?.length ? (
        <BottomSheetDialog
          ref={quotesDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <QuoteList
              quotes={quotes}
              selectedQuote={selectedQuote}
              userFeeTier={userFeeTier}
              onChange={onQuoteIdChange}
              onReset={() => onQuoteIdChange(null)}
            />
          )}
        />
      ) : null}
    </>
  );
}
