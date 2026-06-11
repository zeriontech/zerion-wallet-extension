import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { useMeasure } from 'src/ui/shared/useMeasure';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import { toIncomingTransaction } from 'src/shared/types/Quote';
import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import { formatPercent } from 'src/shared/units/formatPercent';
import { noValueDash } from 'src/ui/shared/typography';
import { getSlippageOptions } from 'src/ui/pages/SwapForm/SlippageSettings/getSlippageOptions';
import { SlippageSettings } from 'src/ui/pages/SwapForm/SlippageSettings';
import type { SwapFormState2 } from '../types';
import { NetworkFeeDialog2 } from '../NetworkFeeDialog2';
import { formatNetworkFee } from '../formatNetworkFee';
import {
  getBaseFee,
  getConfigurationEffectiveGasPrice,
  getCustomFormDefaults,
  getNetworkFeeRatio,
} from '../getNetworkFeeForSpeed';
import { ProviderSelector } from './ProviderSelector';
import { NonceLine2 } from './NonceLine2';
import * as styles from './QuoteDetails.module.css';

function DetailRow({
  label,
  value,
  onClick,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <UIText kind="small/regular">{label}</UIText>
      <UIText kind="small/accent">{value}</UIText>
    </HStack>
  );
  if (onClick) {
    return (
      <UnstyledButton onClick={onClick} className={styles.detailLinkRow}>
        {content}
      </UnstyledButton>
    );
  }
  return content;
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
      <Tooltip className={styles.tooltip} gutter={8} portal={false}>
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

function getSlippageDisplay(
  formState: SwapFormState2,
  quote: Quote2 | null
): string {
  const chain = createChain(formState.inputChain);
  if (formState.slippage != null && formState.slippage !== 'auto') {
    const { slippagePercent } = getSlippageOptions({
      chain,
      userSlippage: Number(formState.slippage),
    });
    return `${slippagePercent}%`;
  }
  if (quote?.finalSlippage != null) {
    return `Auto \u00b7 ${quote.finalSlippage}%`;
  }
  return 'Auto';
}

export function QuoteDetails({
  quote,
  quotesQuery,
  formState,
  networks,
  address,
  configuration,
  gasPrices,
  onConfigurationChange,
  onProviderChange,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
  networks: Networks;
  address: string;
  configuration: CustomConfiguration;
  gasPrices: ChainGasPrice | null;
  onConfigurationChange: (configuration: CustomConfiguration) => void;
  onProviderChange: (quoteId: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const providerDialog = useDialog2();
  const slippageDialog = useDialog2();
  const networkFeeDialog = useDialog2();
  const [measureRef, { height: contentHeight }] = useMeasure<HTMLDivElement>();
  const { preferences } = usePreferences();
  // Swap-first: the network fee is owned by the swap tx; fall back to approve
  // only when there's no swap tx (shouldn't happen for a valid quote).
  const evmTx = (quote?.transactionSwap ?? quote?.transactionApprove)?.evm;
  const showNonce = Boolean(
    preferences?.configurableNonce && isEthereumAddress(address)
  );

  // Current base fee for the EIP-1559 effective price comes from
  // chain/get-gas-price. The quote ships no base fee, so the same current one
  // is used for the quote's "original" price too.
  const baseFee = getBaseFee(gasPrices);

  // The displayed network fee scales by the ratio of the new effective gas
  // price (from the configuration) to the swap tx's original effective price.
  // No quote refetch. Recomputes on user change and on the 20s gas poll.
  const feeRatio = useMemo(() => {
    const effective = getConfigurationEffectiveGasPrice(
      configuration.networkFee,
      gasPrices,
      baseFee
    );
    return getNetworkFeeRatio(quote, effective, baseFee);
  }, [quote, gasPrices, baseFee, configuration.networkFee]);

  // Quote-derived defaults (GWEI) for the custom form, seeded from the swap
  // tx's own values.
  const customDefaults = useMemo(() => getCustomFormDefaults(quote), [quote]);

  const inputChain = createChain(formState.inputChain);
  const inputChainName = networks.getChainName(inputChain);
  const inputChainIconUrl = networks.getByNetworkId(inputChain)?.icon_url;

  const outputChain = createChain(formState.outputChain);
  const outputChainName = networks.getChainName(outputChain);
  const outputChainIconUrl = networks.getByNetworkId(outputChain)?.icon_url;

  const isCrossChain = formState.outputChain !== formState.inputChain;

  const isVisible = quotesQuery.isLoading || quote != null;

  const isAutoSlippage =
    formState.slippage == null || formState.slippage === 'auto';
  const showAutoSlippageInCollapsed =
    isAutoSlippage && quote?.finalSlippage != null && quote.finalSlippage > 1;

  return (
    <MotionConfig transition={{ duration: 0.15 }}>
      {isVisible ? (
        <VStack gap={0}>
          <div className={styles.detailsContainer}>
            <VStack gap={0}>
              <VStack gap={16}>
                <DetailRow
                  label="Network Fee"
                  onClick={evmTx ? networkFeeDialog.openDialog : undefined}
                  value={
                    quote ? (
                      <HStack gap={4} alignItems="center">
                        <UIText kind="small/accent">
                          {formatNetworkFee(quote, feeRatio)}
                        </UIText>
                        {evmTx ? (
                          <ChevronRightIcon
                            className={styles.detailLinkChevron}
                          />
                        ) : null}
                      </HStack>
                    ) : quotesQuery.isLoading ? (
                      <CircleSpinner />
                    ) : (
                      noValueDash
                    )
                  }
                />
                {showAutoSlippageInCollapsed ? (
                  <DetailRow
                    label="Slippage"
                    onClick={slippageDialog.openDialog}
                    value={
                      <HStack gap={4} alignItems="center">
                        <UIText kind="small/accent">
                          {getSlippageDisplay(formState, quote)}
                        </UIText>
                        <ChevronRightIcon
                          className={styles.detailLinkChevron}
                        />
                      </HStack>
                    }
                  />
                ) : null}
              </VStack>
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
                        {showAutoSlippageInCollapsed ? null : (
                          <DetailRow
                            label="Slippage"
                            onClick={slippageDialog.openDialog}
                            value={
                              <HStack gap={4} alignItems="center">
                                <UIText kind="small/accent">
                                  {getSlippageDisplay(formState, quote)}
                                </UIText>
                                <ChevronRightIcon
                                  className={styles.detailLinkChevron}
                                />
                              </HStack>
                            }
                          />
                        )}
                        {showNonce ? (
                          <React.Suspense
                            fallback={
                              <DetailRow label="Nonce" value={noValueDash} />
                            }
                          >
                            {evmTx ? (
                              <NonceLine2
                                transaction={toIncomingTransaction(evmTx)}
                                chain={createChain(formState.inputChain)}
                                userNonce={configuration.nonce ?? null}
                                onChange={(nonce) =>
                                  onConfigurationChange({
                                    ...configuration,
                                    nonce,
                                  })
                                }
                              />
                            ) : (
                              <DetailRow label="Nonce" value={noValueDash} />
                            )}
                          </React.Suspense>
                        ) : null}
                        <DetailRow
                          label="Provider"
                          onClick={
                            quote ? providerDialog.openDialog : undefined
                          }
                          value={
                            quote ? (
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
      <Dialog2
        open={slippageDialog.open}
        onClose={slippageDialog.closeDialog}
        title="Slippage"
        size="content"
        autoFocusInput={false}
      >
        <div style={{ padding: 16, paddingTop: 0 }}>
          <SlippageSettings
            chain={inputChain}
            includeAuto={true}
            configuration={configuration}
            onConfigurationChange={(value) => {
              onConfigurationChange(value);
              slippageDialog.closeDialog();
            }}
          />
        </div>
      </Dialog2>
      {evmTx ? (
        <NetworkFeeDialog2
          open={networkFeeDialog.open}
          onClose={networkFeeDialog.closeDialog}
          onSubmit={(networkFee) =>
            onConfigurationChange({ ...configuration, networkFee })
          }
          chain={inputChain}
          txType={evmTx.type}
          configuration={configuration}
          defaults={customDefaults}
          quote={quote}
          gasPrices={gasPrices}
          baseFee={baseFee}
        />
      ) : null}
    </MotionConfig>
  );
}
