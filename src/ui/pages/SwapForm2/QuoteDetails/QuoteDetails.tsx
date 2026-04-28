import React, { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  Tooltip,
  TooltipAnchor,
  TooltipProvider,
} from '@ariakit/react/tooltip';
import { useMeasure } from 'src/ui/shared/useMeasure';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
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

function ZerionFeeLabel() {
  const { data: config, isLoading: isConfigLoading } = useFirebaseConfig([
    'zerion_fee_learn_more_link',
  ]);
  const learnMoreLink = config?.zerion_fee_learn_more_link;

  return (
    <TooltipProvider placement="top" timeout={150}>
      <HStack gap={0} alignItems="center">
        <span>Zerion Fee</span>
        <TooltipAnchor
          render={
            <span
              style={{
                display: 'inline-flex',
                cursor: 'help',
              }}
            />
          }
        >
          <InfoIcon
            style={{
              width: 20,
              height: 20,
              color: 'var(--neutral-500)',
              display: 'block',
            }}
          />
        </TooltipAnchor>
      </HStack>
      <Tooltip className={styles.tooltip} gutter={8}>
        <UIText kind="caption/regular" color="var(--white)">
          Applies to all Multichain transactions. Zerion Premium DNA holders get
          discounts.{' '}
          {isConfigLoading || !learnMoreLink ? null : (
            <UnstyledAnchor
              href={learnMoreLink}
              rel="noopener noreferrer"
              target="_blank"
              style={{ color: 'var(--white)', textDecoration: 'underline' }}
            >
              Learn more
            </UnstyledAnchor>
          )}
        </UIText>
      </Tooltip>
    </TooltipProvider>
  );
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
  onSlippageClick,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
  networks: Networks;
  onProviderChange: (quoteId: string | null) => void;
  onSlippageClick: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const providerDialog = useDialog2();
  const [measureRef, { height: contentHeight }] = useMeasure<HTMLDivElement>();

  const inputChain = createChain(formState.inputChain);
  const inputChainName = networks.getChainName(inputChain);
  const inputChainIconUrl = networks.getByNetworkId(inputChain)?.icon_url;

  const outputChain = formState.outputChain
    ? createChain(formState.outputChain)
    : null;
  const outputChainName = outputChain
    ? networks.getChainName(outputChain)
    : null;
  const outputChainIconUrl = outputChain
    ? networks.getByNetworkId(outputChain)?.icon_url
    : null;

  const isCrossChain =
    outputChain != null && formState.outputChain !== formState.inputChain;

  const isVisible = quotesQuery.isLoading || quote != null;

  return (
    <MotionConfig transition={{ duration: 0.15 }}>
      {isVisible ? (
        <VStack gap={0}>
          <div className={styles.detailsContainer}>
            <VStack gap={0}>
              <DetailRow
                label="Network Fee"
                value={quote ? formatNetworkFee(quote) : noValueDash}
              />
              <AnimatePresence initial={false}>
                {isExpanded ? (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: contentHeight || 'auto',
                      opacity: 1,
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <motion.div
                      ref={measureRef}
                      initial={{ scale: 0.93, filter: 'blur(3px)' }}
                      animate={{ scale: 1, filter: 'blur(0px)' }}
                      exit={{ scale: 0.93, filter: 'blur(3px)' }}
                      style={{ transformOrigin: 'top center' }}
                    >
                      <VStack gap={16}>
                        <div />
                        <DetailRow
                          label="Slippage"
                          value={
                            <UnstyledButton
                              onClick={onSlippageClick}
                              className={styles.detailLinkButton}
                            >
                              <HStack gap={4} alignItems="center">
                                <UIText kind="small/accent">
                                  {getSlippageDisplay(formState)}
                                </UIText>
                                <ChevronRightIcon
                                  className={styles.detailLinkChevron}
                                />
                              </HStack>
                            </UnstyledButton>
                          }
                        />
                        <DetailRow
                          label="Provider"
                          value={
                            quote ? (
                              <UnstyledButton
                                onClick={providerDialog.openDialog}
                                className={styles.detailLinkButton}
                              >
                                <HStack gap={4} alignItems="center">
                                  <AnimatePresence
                                    initial={false}
                                    mode="popLayout"
                                  >
                                    <motion.div
                                      key={quote.contractMetadata.id}
                                      initial={{
                                        y: 6,
                                        filter: 'blur(2px)',
                                        opacity: 0,
                                      }}
                                      animate={{
                                        y: 0,
                                        filter: 'blur(0px)',
                                        opacity: 1,
                                      }}
                                      exit={{
                                        y: -6,
                                        filter: 'blur(2px)',
                                        opacity: 0,
                                      }}
                                      transition={{ duration: 0.25 }}
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
                                      </HStack>
                                    </motion.div>
                                  </AnimatePresence>
                                  <ChevronRightIcon
                                    className={styles.detailLinkChevron}
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
                              <HStack gap={8} alignItems="center">
                                <NetworkIcon
                                  src={inputChainIconUrl}
                                  name={inputChainName}
                                  size={16}
                                  style={{ borderRadius: 4 }}
                                />
                                <UIText kind="small/accent">
                                  {inputChainName}
                                </UIText>
                              </HStack>
                              {isCrossChain ? (
                                <>
                                  <ChevronRightIcon
                                    style={{
                                      display: 'block',
                                      width: 16,
                                      height: 16,
                                      color: 'var(--neutral-500)',
                                    }}
                                  />
                                  <HStack gap={8} alignItems="center">
                                    <NetworkIcon
                                      src={outputChainIconUrl}
                                      name={outputChainName}
                                      size={16}
                                      style={{ borderRadius: 4 }}
                                    />
                                    <UIText kind="small/accent">
                                      {outputChainName}
                                    </UIText>
                                  </HStack>
                                </>
                              ) : null}
                            </HStack>
                          }
                        />
                        <DetailRow
                          label={<ZerionFeeLabel />}
                          value={
                            quote ? (
                              quote.protocolFee.percentage === 0 ? (
                                <UIText
                                  kind="small/accent"
                                  inline={true}
                                  style={{
                                    background:
                                      'linear-gradient(113deg, #20DBE7 6.71%, #4B7AEF 58.69%, #BC29EF 102.67%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                  }}
                                >
                                  Free
                                </UIText>
                              ) : (
                                `${formatPercent(
                                  quote.protocolFee.percentage,
                                  'en'
                                )}%`
                              )
                            ) : (
                              noValueDash
                            )
                          }
                        />
                      </VStack>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
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
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                style={{ display: 'inline-flex' }}
              >
                <ChevronDownIcon
                  style={{
                    display: 'block',
                    width: 16,
                    height: 16,
                    color: 'var(--neutral-500)',
                  }}
                />
              </motion.span>
            </UnstyledButton>
          </div>
        </VStack>
      ) : null}

      <Dialog2
        open={providerDialog.open}
        onClose={providerDialog.closeDialog}
        title="Rates"
        autoFocusInput={false}
      >
        {quotesQuery.quotes?.length ? (
          <ProviderSelector
            quotes={quotesQuery.quotes}
            selectedQuote={quote}
            onSelect={(quoteId) => {
              onProviderChange(quoteId);
              providerDialog.closeDialog();
            }}
            onReset={() => {
              onProviderChange(null);
              providerDialog.closeDialog();
            }}
          />
        ) : null}
      </Dialog2>
    </MotionConfig>
  );
}
