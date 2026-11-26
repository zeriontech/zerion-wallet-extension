import React, { useEffect, useMemo } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkFeeConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { IncomingTransactionWithFrom } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';

/**
 * Fallback for the confirm-screen Slow hint threshold, in USD. Firebase Remote
 * Config key `extension_fee_hint_config.min_savings_usd` overrides it without
 * a release (see src/modules/remote-config/plugins/firebase.ts).
 */
export const DEFAULT_FEE_HINT_MIN_SAVINGS_USD = 1;

/**
 * Offers Slow on the confirm screen when switching would save at least
 * `min_savings_usd`. The saving is this transaction's Fast fee minus its Slow
 * fee, both priced by `useTransactionFee` on the same gas and fiat price.
 * Rendered only while Fast is selected, so there is always an offer to make.
 */
export function NetworkFeeHint({
  transaction,
  chain,
  networkFeeConfiguration,
  chainGasPrices,
  fastTransactionFee,
  expectedGas,
  preserveTransactionMaxFee,
  onSelectSlow,
  onShown,
}: {
  transaction: IncomingTransactionWithFrom;
  chain: Chain;
  /** The confirm screen's configuration; only `speed` changes for Slow. */
  networkFeeConfiguration: NetworkFeeConfiguration;
  chainGasPrices: ChainGasPrice | null;
  /** The confirm screen's current (Fast) fee. */
  fastTransactionFee: TransactionFee;
  expectedGas?: number | null;
  preserveTransactionMaxFee: boolean;
  onSelectSlow: () => void;
  /**
   * Called once the hint is on screen, so the sign flow can report a sticky
   * `fee_hint_shown` for this transaction even if the user acts on it.
   */
  onShown: () => void;
}) {
  const { currency } = useCurrency();
  const { data: hintConfig } = useRemoteConfigValue('extension_fee_hint_config');
  const slowTransactionFee = useTransactionFee({
    address: transaction.from,
    transaction,
    chain,
    onFeeValueCommonReady: null,
    networkFeeConfiguration: { ...networkFeeConfiguration, speed: 'average' },
    keepPreviousData: true,
    chainGasPrices,
    expectedGas,
    preserveTransactionMaxFee,
  });

  const savingUsd = useMemo(() => {
    const fastFeeFiat = fastTransactionFee.costs?.feeValueFiat;
    const slowFeeFiat = slowTransactionFee.costs?.feeValueFiat;
    if (!fastFeeFiat || !slowFeeFiat) {
      return null;
    }
    const saving = fastFeeFiat.minus(slowFeeFiat);
    return saving.gt(0) ? saving : null;
  }, [fastTransactionFee.costs, slowTransactionFee.costs]);

  const configuredThreshold = hintConfig?.min_savings_usd;
  const minSavingsUsd =
    typeof configuredThreshold === 'number' && Number.isFinite(configuredThreshold)
      ? configuredThreshold
      : DEFAULT_FEE_HINT_MIN_SAVINGS_USD;
  const visible = savingUsd != null && savingUsd.gte(minSavingsUsd);

  useEffect(() => {
    if (visible) {
      onShown();
    }
  }, [visible, onShown]);

  if (!visible) {
    return null;
  }

  return (
    <HStack gap={4} justifyContent="end" style={{ marginTop: 4 }}>
      <UnstyledButton type="button" onClick={onSelectSlow}>
        <UIText kind="small/accent" color="var(--primary)">
          {`Save ${formatCurrencyValueExtra(savingUsd.toNumber(), 'en', currency, {
            zeroRoundingFallback: 0.01,
          })} · Switch to Slow`}
        </UIText>
      </UnstyledButton>
    </HStack>
  );
}
