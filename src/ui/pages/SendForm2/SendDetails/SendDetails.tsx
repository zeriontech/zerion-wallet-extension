import React, { useState } from 'react';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import { useMeasure } from 'src/ui/shared/useMeasure';
import type { Networks } from 'src/modules/networks/Networks';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { createChain } from 'src/modules/networks/Chain';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/shared/typography';
import { NetworkFeeLevelLabel } from 'src/ui/shared/NetworkFeeLevelLabel';
import { DetailRow, NonceLine2 } from 'src/ui/components/DetailRow';
import * as detailRowStyles from 'src/ui/components/DetailRow/DetailRow.module.css';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { NetworkFeeDialog2 } from 'src/ui/components/NetworkFeeDialog2';
import { formatNetworkFee } from 'src/ui/components/NetworkFeeDialog2/formatNetworkFee';
import {
  getBaseFee,
  getCustomFormDefaults,
} from 'src/ui/components/NetworkFeeDialog2/getNetworkFeeForSpeed';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { getBaseAssetDecimals } from 'src/modules/networks/NetworkInfo';
import { baseToCommon, normalizeNumberValue } from 'src/shared/units/convert';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import type { SendQuote } from '../useSendTransaction';
import { useNetworkFeeFiatValue } from '../shared/useNetworkFeeFiatValue';
import * as styles from './SendDetails.module.css';

export function SendDetails({
  inputChain,
  networks,
  sendQuote,
  displayedNetworkFee,
  hasNetworkFeeOverride,
  network,
  evmTx,
  address,
  gasPrices,
  configuration,
  onConfigurationChange,
  userNonce,
  onNonceChange,
  isLoading,
  receivedAmount,
  typedAmount,
  tokenSymbol,
}: {
  inputChain: string;
  networks: Networks;
  sendQuote: SendQuote | null;
  /** The fee for the selected speed (backend fee untouched without an override). */
  displayedNetworkFee: SendQuote['networkFee'];
  /** Whether the user explicitly picked a fee; the dialog Fast row is unscaled otherwise. */
  hasNetworkFeeOverride: boolean;
  network: NetworkInfo | null;
  evmTx: IncomingTransaction | null;
  address: string;
  gasPrices: ChainGasPrice | null;
  configuration: CustomConfiguration;
  onConfigurationChange: (configuration: CustomConfiguration) => void;
  userNonce: string | null;
  onNonceChange: (nonce: string | null) => void;
  isLoading: boolean;
  receivedAmount?: Amount | null;
  typedAmount?: string | null;
  tokenSymbol?: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [measureRef, { height: contentHeight }] = useMeasure<HTMLDivElement>();
  const networkFeeDialog = useDialog2();
  const { preferences } = usePreferences();
  const { currency } = useCurrency();
  const baseFee = getBaseFee(gasPrices);
  const customDefaults = getCustomFormDefaults(sendQuote);
  const nativeDecimals = network ? getBaseAssetDecimals(network) : null;
  const rawFee = useNetworkFeeFiatValue({
    networkFee: sendQuote?.networkFee ?? null,
    network,
    currency,
  });
  const displayedFee = useNetworkFeeFiatValue({
    networkFee: displayedNetworkFee,
    network,
    currency,
  });
  const rowQuote = sendQuote ? { ...sendQuote, networkFee: displayedNetworkFee } : null;
  const maxFeeBase = (() => {
    if (!evmTx) {
      return null;
    }
    const gas = getGas(evmTx);
    const price = evmTx.maxFeePerGas ?? evmTx.gasPrice;
    if (gas == null || price == null) {
      return null;
    }
    return new BigNumber(normalizeNumberValue(gas)).multipliedBy(normalizeNumberValue(price));
  })();
  const maxFeeCommon =
    maxFeeBase && nativeDecimals != null ? baseToCommon(maxFeeBase, nativeDecimals) : null;
  const maxFeeFiat =
    maxFeeCommon && displayedFee.feePrice != null
      ? maxFeeCommon.multipliedBy(displayedFee.feePrice).toNumber()
      : null;
  const showNonce = Boolean(preferences?.configurableNonce && isEthereumAddress(address));

  const chain = createChain(inputChain);
  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getByNetworkId(chain)?.iconUrl;

  const showReceived = (() => {
    if (!receivedAmount || !typedAmount) return false;
    try {
      return !new BigNumber(receivedAmount.quantity).eq(typedAmount);
    } catch {
      return false;
    }
  })();

  const receivedValue =
    showReceived && receivedAmount
      ? (() => {
          const quantityNode = formatTokenValue(receivedAmount.quantity, tokenSymbol ?? '');
          if (receivedAmount.value != null) {
            return `${quantityNode} (${formatCurrencyValueExtra(
              receivedAmount.value,
              'en',
              currency,
              { zeroRoundingFallback: 0.01 },
            )})`;
          }
          return quantityNode;
        })()
      : null;

  return (
    <MotionConfig transition={{ duration: 0.15 }}>
      <VStack gap={0}>
        <div className={styles.detailsContainer}>
          <VStack gap={0}>
            <DetailRow
              label="Network Fee"
              onClick={evmTx ? networkFeeDialog.openDialog : undefined}
              value={
                rowQuote ? (
                  <HStack gap={4} alignItems="center">
                    <NetworkFeeLevelLabel speed={configuration.networkFee.speed} />
                    <UIText kind="small/accent">
                      {formatNetworkFee(rowQuote, 1, {
                        fallbackFiatValue: displayedFee.feeFiatValue,
                        fallbackSymbol: network?.baseAsset?.symbol,
                        currency,
                      })}
                    </UIText>
                    {evmTx ? (
                      <ChevronRightIcon className={detailRowStyles.detailLinkChevron} />
                    ) : null}
                  </HStack>
                ) : isLoading ? (
                  <CircleSpinner />
                ) : (
                  noValueDash
                )
              }
            />
            <AnimatePresence initial={false}>
              {isExpanded ? (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: contentHeight || 'auto', opacity: 1 }}
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
                      {showReceived ? <DetailRow label="Received" value={receivedValue} /> : null}
                      {maxFeeCommon ? (
                        <DetailRow
                          label="Max fee"
                          value={`${formatTokenValue(
                            maxFeeCommon.toFixed(),
                            network?.baseAsset?.symbol,
                          )}${
                            maxFeeFiat != null
                              ? ` (${formatCurrencyValueExtra(maxFeeFiat, 'en', currency, {
                                  zeroRoundingFallback: 0.01,
                                })})`
                              : ''
                          }`}
                        />
                      ) : null}
                      {showNonce ? (
                        <React.Suspense fallback={<DetailRow label="Nonce" value={noValueDash} />}>
                          {evmTx && evmTx.from ? (
                            <NonceLine2
                              transaction={{ ...evmTx, from: evmTx.from }}
                              chain={chain}
                              userNonce={userNonce}
                              onChange={onNonceChange}
                            />
                          ) : (
                            <DetailRow label="Nonce" value={noValueDash} />
                          )}
                        </React.Suspense>
                      ) : null}
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
            <UIText kind="caption/regular" style={{ fontWeight: 600, color: 'var(--neutral-500)' }}>
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
      {evmTx ? (
        <NetworkFeeDialog2
          open={networkFeeDialog.open}
          onClose={networkFeeDialog.closeDialog}
          onSubmit={(networkFeeConfig) =>
            onConfigurationChange({
              ...configuration,
              networkFee: networkFeeConfig,
            })
          }
          chain={chain}
          txType={evmTx.type}
          configuration={configuration}
          defaults={customDefaults}
          quote={sendQuote}
          gasPrices={gasPrices}
          baseFee={baseFee}
          fallbackFiatValue={rawFee.feeFiatValue}
          fallbackSymbol={network?.baseAsset?.symbol}
          currency={currency}
          nativeDecimals={nativeDecimals}
          hasNetworkFeeOverride={hasNetworkFeeOverride}
        />
      ) : null}
    </MotionConfig>
  );
}
