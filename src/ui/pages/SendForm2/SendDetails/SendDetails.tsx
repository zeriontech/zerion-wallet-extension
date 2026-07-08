import React, { useState } from 'react';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { useMeasure } from 'src/ui/shared/useMeasure';
import type { Networks } from 'src/modules/networks/Networks';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { createChain } from 'src/modules/networks/Chain';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/ui/shared/typography';
import { NonceLine2 } from 'src/ui/pages/SwapForm2/QuoteDetails/NonceLine2';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { NetworkFeeDialog2 } from 'src/ui/pages/SwapForm2/NetworkFeeDialog2';
import {
  getBaseFee,
  getCustomFormDefaults,
} from 'src/ui/pages/SwapForm2/getNetworkFeeForSpeed';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import type { SendQuote } from '../useSendTransaction';
import { SendDataLine } from './SendDataLine';
import * as styles from './SendDetails.module.css';

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

function formatNetworkFee(
  fee: NetworkFeeType | null,
  network: NetworkConfig | null,
  fiatValue: number | null,
  currency: string
): React.ReactNode {
  if (!fee) return noValueDash;
  if (fee.free) return 'Free';
  const value = fee.amount?.value ?? fiatValue;
  if (value != null) {
    return formatCurrencyValueExtra(value, 'en', currency, {
      zeroRoundingFallback: 0.01,
    });
  }
  if (fee.amount?.quantity) {
    const symbol = fee.fungible?.symbol ?? network?.native_asset?.symbol ?? '';
    return formatTokenValue(fee.amount.quantity, symbol);
  }
  return noValueDash;
}

export function SendDetails({
  inputChain,
  networks,
  sendQuote,
  network,
  evmTx,
  address,
  gasPrices,
  configuration,
  onConfigurationChange,
  userNonce,
  onNonceChange,
  customData,
  onCustomDataChange,
  isLoading,
  receivedAmount,
  typedAmount,
  tokenSymbol,
}: {
  inputChain: string;
  networks: Networks;
  sendQuote: SendQuote | null;
  network: NetworkConfig | null;
  evmTx: IncomingTransaction | null;
  address: string;
  gasPrices: ChainGasPrice | null;
  configuration: CustomConfiguration;
  onConfigurationChange: (configuration: CustomConfiguration) => void;
  userNonce: string | null;
  onNonceChange: (nonce: string | null) => void;
  customData: string | null;
  onCustomDataChange: (value: string | undefined) => void;
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
  const networkFee: NetworkFeeType | null = sendQuote?.networkFee ?? null;
  const baseFee = getBaseFee(gasPrices);
  const customDefaults = getCustomFormDefaults(sendQuote);
  const showNonce = Boolean(
    preferences?.configurableNonce && isEthereumAddress(address)
  );
  // Custom data: gated behind the Developer Tools "Custom Data" toggle, EVM
  // senders only. Shown for any EVM send (native + ERC-20); the backend owns
  // how it attaches the data to the built transaction.
  const showData = Boolean(
    preferences?.configurableTransactionData && isEthereumAddress(address)
  );

  const chain = createChain(inputChain);
  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getByNetworkId(chain)?.icon_url;

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
          const quantityNode = formatTokenValue(
            receivedAmount.quantity,
            tokenSymbol ?? ''
          );
          if (receivedAmount.value != null) {
            return `${quantityNode} (${formatCurrencyValueExtra(
              receivedAmount.value,
              'en',
              currency,
              { zeroRoundingFallback: 0.01 }
            )})`;
          }
          return quantityNode;
        })()
      : null;

  const feeFungibleId = networkFee?.fungible?.id ?? network?.native_asset?.id;
  const { data: feeFungibleResponse } = useAssetListFungibles(
    feeFungibleId ? { fungibleIds: [feeFungibleId], currency } : { currency },
    { suspense: false }
  );
  const feePrice = feeFungibleId
    ? feeFungibleResponse?.data.find((f) => f.id === feeFungibleId)?.meta
        .price ?? null
    : null;
  const feeQuantity = networkFee?.amount?.quantity ?? null;
  const feeFiatValue =
    feeQuantity && feePrice != null
      ? new BigNumber(feeQuantity).multipliedBy(feePrice).toNumber()
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
                networkFee ? (
                  <HStack gap={4} alignItems="center">
                    <UIText kind="small/accent">
                      {formatNetworkFee(
                        networkFee,
                        network,
                        feeFiatValue,
                        currency
                      )}
                    </UIText>
                    {evmTx ? (
                      <ChevronRightIcon className={styles.detailLinkChevron} />
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
                      {showReceived ? (
                        <DetailRow label="Received" value={receivedValue} />
                      ) : null}
                      {showNonce ? (
                        <React.Suspense
                          fallback={
                            <DetailRow label="Nonce" value={noValueDash} />
                          }
                        >
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
                      {showData ? (
                        <SendDataLine
                          value={customData}
                          onChange={onCustomDataChange}
                        />
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
        />
      ) : null}
    </MotionConfig>
  );
}
