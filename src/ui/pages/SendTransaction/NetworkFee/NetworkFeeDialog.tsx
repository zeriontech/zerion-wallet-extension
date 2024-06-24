import React, { useMemo, useRef, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import type {
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from '@zeriontech/transactions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import {
  DialogButtonValue,
  DialogTitle,
} from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import ArrowLeftcon from 'jsx:src/ui/assets/arrow-left.svg';
import type { Chain } from 'src/modules/networks/Chain';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import type {
  IncomingTransaction,
  IncomingTransactionWithFrom,
} from 'src/modules/ethereum/types/IncomingTransaction';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import {
  formatGasPrice,
  gweiToWei,
  weiToGwei,
} from 'src/shared/units/formatGasPrice';
import { InnerLabelInput } from 'src/ui/ui-kit/Input/InnerLabelInput';
import { useNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { invariant } from 'src/shared/invariant';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import {
  FLOAT_INPUT_PATTERN,
  INT_INPUT_PATTERN,
} from 'src/ui/shared/forms/inputs';
import { useEstimateGas } from 'src/modules/ethereum/transactions/useEstimateGas';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { apostrophe } from 'src/ui/shared/typography';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { NetworkFeeIcon } from './NetworkFeeIcon';
import { NETWORK_SPEED_TO_TITLE } from './constants';

const OPTIONS: NetworkFeeSpeed[] = ['fast', 'average', 'custom'];

function getCustomFeeDescription({
  fiat,
  gasPrice,
  currency,
}: {
  fiat?: BigNumber.Value;
  gasPrice: number | string;
  currency: string;
}) {
  return `${
    fiat ? `${formatCurrencyValue(fiat, 'en', currency)} (` : ''
  }${formatGasPrice(gasPrice)}${fiat ? ')' : ''}`;
}

function formDataToGasConfiguration(
  formData: FormData
): NetworkFeeConfiguration {
  const priorityFee = (formData.get('priorityFee') ?? '') as string;
  const maxFee = (formData.get('maxFee') ?? '') as string;
  const baseFee = (formData.get('baseFee') ?? '') as string;
  const gasLimit = (formData.get('gasLimit') ?? '') as string;

  if (formData.has('baseFee')) {
    return {
      speed: 'custom',
      custom1559GasPrice: null,
      gasLimit,
      customClassicGasPrice: gweiToWei(baseFee),
    };
  } else {
    return {
      speed: 'custom',
      customClassicGasPrice: null,
      custom1559GasPrice: {
        priorityFee: gweiToWei(priorityFee),
        maxFee: gweiToWei(maxFee),
      },
      gasLimit,
    };
  }
}

function setFormValue(form: HTMLFormElement, name: string, value: unknown) {
  const input = form.elements.namedItem(name);
  invariant(input, `Input ${name} not found`);
  if (input instanceof HTMLInputElement) {
    input.value = String(value);
  } else {
    throw new Error('Must be an input');
  }
}

function setPatternValidity(event: React.ChangeEvent<HTMLInputElement>) {
  if (event.currentTarget.validity.patternMismatch) {
    event.currentTarget.setCustomValidity(
      'Gas Price value must be a positive number'
    );
  } else {
    event.currentTarget.setCustomValidity('');
  }
}

function CustomNetworkFeeForm({
  chain,
  value,
  chainGasPrices,
  onSubmit,
  transaction,
}: {
  chain: Chain;
  value: NetworkFeeConfiguration;
  chainGasPrices: ChainGasPrice;
  onSubmit(value: NetworkFeeConfiguration): void;
  transaction: IncomingTransaction;
}) {
  const {
    eip1559: maybeEIP1559,
    classic: maybeClassic,
    optimistic: maybeOptimistic,
  } = chainGasPrices.fast;

  const eip1559 = maybeEIP1559 ?? maybeOptimistic?.underlying.eip1559;
  const classic = maybeClassic ?? maybeOptimistic?.underlying.classic;
  const type = eip1559 ? 'eip1559' : classic ? 'classic' : null;
  if (!type) {
    throw new Error('No gas price configuration has been found for chain');
  }

  const { currency } = useCurrency();
  const [configuration, setConfiguration] = useState(value);

  const { value: nativeAsset } = useNativeAsset(chain);
  const { data: gasEstimation, isError: isGasEstimationError } = useEstimateGas(
    { transaction }
  );

  const formRef = useRef<HTMLFormElement | null>(null);
  const defaultBaseFee = value.customClassicGasPrice ?? classic ?? 0;
  const defaultPriorityFee =
    value.custom1559GasPrice?.priorityFee ?? eip1559?.priorityFee ?? 0;
  const defaultMaxFee =
    value.custom1559GasPrice?.maxFee ?? eip1559?.maxFee ?? 0;

  const defaultBaseFeeGWEI = weiToGwei(defaultBaseFee);
  const defaultPriorityFeeGWEI = weiToGwei(defaultPriorityFee);
  const defaultMaxFeeGWEI = weiToGwei(defaultMaxFee);
  const transactionGasLimit = new BigNumber(
    Number(getGas(transaction))
  ).toFixed();
  const defaultGas = value.gasLimit || transactionGasLimit;

  const baseFee = configuration.customClassicGasPrice ?? defaultBaseFee;
  const priorityFee =
    configuration.custom1559GasPrice?.priorityFee ?? defaultPriorityFee;
  const maxFee = configuration.custom1559GasPrice?.maxFee ?? defaultMaxFee;

  const { expectedFeeFiat, maxFeeFiat, baseFeeFiat } = useMemo(() => {
    const gas = getGas(transaction);
    if (!nativeAsset?.price || !gas) {
      return {};
    }
    const { price } = nativeAsset;
    const decimals = getDecimals({ asset: nativeAsset, chain });

    function getFiatValue(fee: number | string) {
      return baseToCommon(fee, decimals).times(price.value).times(Number(gas));
    }

    return {
      expectedFeeFiat: getFiatValue(
        Math.min((priorityFee || 0) + (eip1559?.baseFee || 0), maxFee)
      ),
      maxFeeFiat: getFiatValue(maxFee),
      baseFeeFiat: getFiatValue(baseFee),
    };
  }, [nativeAsset, priorityFee, maxFee, baseFee, eip1559, transaction, chain]);

  const [gasLimit, setGasLimit] = useState(defaultGas);
  const showLowGasLimitWarning =
    gasEstimation && Number(gasLimit) * 1.1 < gasEstimation;

  return (
    <form
      ref={formRef}
      style={{
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: '1fr auto',
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity()) {
          onSubmit(formDataToGasConfiguration(new FormData(form)));
        }
      }}
      onChange={(event) => {
        const form = event.currentTarget;
        if (form.checkValidity()) {
          setConfiguration(formDataToGasConfiguration(new FormData(form)));
        }
      }}
    >
      {type === 'eip1559' && eip1559 ? (
        <VStack gap={16} style={{ alignContent: 'start' }}>
          <VStack gap={12}>
            <HStack gap={24} justifyContent="space-between">
              <UIText kind="small/regular">Base Fee</UIText>
              <UIText kind="small/accent">
                {formatGasPrice(eip1559.baseFee)}
              </UIText>
            </HStack>
            <div
              style={{
                width: '100%',
                height: 1,
                backgroundColor: 'var(--neutral-300',
              }}
            />
          </VStack>
          <HStack gap={16} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <InnerLabelInput
              inputMode="numeric"
              autoFocus={true}
              label="Priority Fee (GWEI)"
              name="priorityFee"
              placeholder="0"
              style={{ border: '1px solid var(--neutral-400)' }}
              defaultValue={defaultPriorityFeeGWEI}
              onChange={setPatternValidity}
              pattern={FLOAT_INPUT_PATTERN}
              required={true}
            />
            <InnerLabelInput
              inputMode="numeric"
              label="Max Fee (GWEI)"
              name="maxFee"
              placeholder="0"
              style={{ border: '1px solid var(--neutral-400)' }}
              defaultValue={defaultMaxFeeGWEI}
              onChange={setPatternValidity}
              pattern={FLOAT_INPUT_PATTERN}
              required={true}
            />
          </HStack>
          <VStack gap={4}>
            <InnerLabelInput
              inputMode="numeric"
              label={
                <HStack gap={4} alignItems="center">
                  <UIText kind="caption/regular" color="var(--neutral-600)">
                    Gas Limit
                  </UIText>
                  <div
                    style={{ display: 'flex', color: 'var(--neutral-600)' }}
                    title={`Specifies the maximum amount of computational work you${apostrophe}re willing to pay for a transaction or contract interaction`}
                  >
                    <QuestionHintIcon />
                  </div>
                </HStack>
              }
              name="gasLimit"
              placeholder="0"
              style={{
                border: showLowGasLimitWarning
                  ? '1px solid var(--notice-500)'
                  : '1px solid var(--neutral-400)',
              }}
              defaultValue={gasLimit}
              pattern={INT_INPUT_PATTERN}
              onChange={(e) => setGasLimit(e.target.value)}
              required={true}
            />
            {isGasEstimationError ? (
              <UIText
                kind="caption/regular"
                color="var(--negative-500)"
                style={{ paddingInline: 2 }}
              >
                Can{apostrophe}t estimate recommended gas limit
              </UIText>
            ) : gasEstimation ? (
              <UIText
                kind="caption/regular"
                color={
                  showLowGasLimitWarning
                    ? 'var(--notice-500)'
                    : 'var(--neutral-500)'
                }
                style={{ paddingInline: 2 }}
              >
                Recommended value:{' '}
                <UnstyledButton
                  type="button"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    if (formRef.current) {
                      setFormValue(
                        formRef.current,
                        'gasLimit',
                        String(gasEstimation)
                      );
                    }
                  }}
                >
                  {gasEstimation}
                </UnstyledButton>
                .
                {showLowGasLimitWarning
                  ? ` We don${apostrophe}t recommend using a gas limit significantly lower than the estimated value.`
                  : null}
              </UIText>
            ) : null}
          </VStack>
          <VStack gap={8}>
            <HStack gap={24} justifyContent="space-between">
              <UIText kind="small/regular">Expected Fee</UIText>
              <UIText kind="small/accent">
                {getCustomFeeDescription({
                  fiat: expectedFeeFiat,
                  gasPrice: Math.min(
                    eip1559.baseFee + (priorityFee || 0),
                    maxFee
                  ),
                  currency,
                })}
              </UIText>
            </HStack>
            <HStack gap={24} justifyContent="space-between">
              <UIText kind="small/regular">Max Fee</UIText>
              {maxFee ? (
                <UIText kind="small/accent">
                  {getCustomFeeDescription({
                    fiat: maxFeeFiat,
                    gasPrice: maxFee,
                    currency,
                  })}
                </UIText>
              ) : null}
            </HStack>
          </VStack>
        </VStack>
      ) : type === 'classic' && classic ? (
        <VStack gap={16} style={{ alignContent: 'start' }}>
          <InnerLabelInput
            inputMode="numeric"
            autoFocus={true}
            label="Base Fee (GWEI)"
            name="baseFee"
            placeholder="0"
            style={{ border: '1px solid var(--neutral-400)' }}
            defaultValue={defaultBaseFeeGWEI}
            onChange={setPatternValidity}
            pattern={FLOAT_INPUT_PATTERN}
            required={true}
          />
          <HStack gap={24} justifyContent="space-between">
            <UIText kind="small/regular">Expected Fee</UIText>
            {baseFee ? (
              <UIText kind="small/accent">
                {getCustomFeeDescription({
                  fiat: baseFeeFiat,
                  gasPrice: baseFee,
                  currency,
                })}
              </UIText>
            ) : null}
          </HStack>
        </VStack>
      ) : null}
      <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button
          type="button"
          kind="regular"
          onClick={(event) => {
            const { form } = event.currentTarget;
            invariant(form, 'Reset button must belong to a form');

            form.reset();
            if (type === 'classic') {
              setFormValue(form, 'baseFee', weiToGwei(classic || 0));
            } else {
              const priorityFee = weiToGwei(eip1559?.priorityFee || 0);
              setFormValue(form, 'priorityFee', priorityFee);
              const maxFee = weiToGwei(eip1559?.maxFee || 0);
              setFormValue(form, 'maxFee', maxFee);
            }
            setFormValue(form, 'gasLimit', transactionGasLimit);
            setConfiguration(formDataToGasConfiguration(new FormData(form)));
          }}
        >
          Reset
        </Button>
        <Button kind="primary">Save</Button>
      </HStack>
    </form>
  );
}

function NetworkFeeButton({
  networkFeeConfiguration,
  chain,
  option,
  onClick,
  chainGasPrices,
  transaction,
}: {
  networkFeeConfiguration: NetworkFeeConfiguration;
  option: NetworkFeeSpeed;
  chain: Chain;
  onClick(): void;
  chainGasPrices?: ChainGasPrice | null;
  transaction: IncomingTransactionWithFrom;
}) {
  const { currency } = useCurrency();
  const { networks } = useNetworks();
  const speedConfiguration = useMemo(() => {
    return {
      ...networkFeeConfiguration,
      speed: option,
    };
  }, [networkFeeConfiguration, option]);

  const { costs, costsQuery } = useTransactionFee({
    address: transaction.from,
    chain,
    transaction,
    networkFeeConfiguration: speedConfiguration,
    chainGasPrices: chainGasPrices ?? null,
    onFeeValueCommonReady: null,
  });
  const {
    relevantFeeValueFiat: feeValueFiat,
    relevantFeeValueCommon: feeValueCommon,
    totalValueExceedsBalance,
  } = costs || {};

  const seconds =
    option !== 'custom' ? chainGasPrices?.[option]?.eta : undefined;

  const selected = option === networkFeeConfiguration.speed;
  const nativeAssetSymbol =
    networks?.getNetworkByName(chain)?.native_asset?.symbol;

  return (
    <SurfaceItemButton
      style={{ height: 48, borderRadius: 12, paddingInline: 0 }}
      outlined={selected}
      onClick={onClick}
      title={
        feeValueCommon
          ? formatTokenValue(feeValueCommon, nativeAssetSymbol)
          : undefined
      }
    >
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <Media
          image={<NetworkFeeIcon speed={option} />}
          text={
            <HStack gap={8} alignItems="center">
              <UIText
                kind="body/accent"
                color={selected ? 'var(--primary)' : undefined}
              >
                {NETWORK_SPEED_TO_TITLE[option]}
              </UIText>
              {seconds ? (
                <UIText kind="body/regular" color="var(--neutral-500)">
                  {`~${formatSeconds(seconds)}`}
                </UIText>
              ) : null}
            </HStack>
          }
          gap={12}
          vGap={0}
          detailText={null}
        />
        {costsQuery.isLoading ? (
          <CircleSpinner />
        ) : feeValueFiat ? (
          <UIText
            kind="small/regular"
            color={selected ? 'var(--primary)' : 'var(--black)'}
          >
            {totalValueExceedsBalance ? 'Up to ' : null}~
            {formatCurrencyValue(feeValueFiat, 'en', currency)}
          </UIText>
        ) : feeValueCommon && nativeAssetSymbol ? (
          <UIText
            kind="small/regular"
            color={selected ? 'var(--primary)' : 'var(--black)'}
          >
            {totalValueExceedsBalance ? 'Up to ' : null}~
            {formatTokenValue(feeValueCommon.toString(), nativeAssetSymbol)}
          </UIText>
        ) : null}
      </HStack>
    </SurfaceItemButton>
  );
}

export const NetworkFeeDialog = React.forwardRef<
  HTMLDialogElementInterface,
  {
    onSubmit(value: NetworkFeeConfiguration): void;
    chain: Chain;
    value: NetworkFeeConfiguration;
    transaction: IncomingTransactionWithFrom;
    chainGasPrices: ChainGasPrice | null;
    customViewOnly?: boolean;
  }
>(
  (
    {
      onSubmit,
      value,
      chain,
      transaction,
      chainGasPrices,
      customViewOnly = false,
    },
    ref
  ) => {
    const [view, setView] = useState<'custom' | 'default'>(
      customViewOnly ? 'custom' : 'default'
    );

    const dialogHeight = view === 'default' ? '230px' : '90vh';

    return (
      <BottomSheetDialog
        ref={ref}
        height={dialogHeight}
        containerStyle={{
          ['--surface-background-color' as string]: 'transparent',
        }}
      >
        {view === 'default' ? (
          <>
            <DialogTitle
              alignTitle="start"
              title={<UIText kind="headline/h3">Network Fee</UIText>}
              closeKind="icon"
            />
            <Spacer height={10} />
            <React.Suspense fallback={<ViewLoading />}>
              <SurfaceList
                style={{ paddingBlockEnd: 0 }}
                items={OPTIONS.map((option) => {
                  return {
                    key: option,
                    isInteractive: true,
                    pad: false,
                    disabled: option === 'custom' && !chainGasPrices,
                    component: (
                      <NetworkFeeButton
                        networkFeeConfiguration={value}
                        chainGasPrices={chainGasPrices}
                        option={option}
                        onClick={() => {
                          if (option === 'custom') {
                            setView('custom');
                          } else {
                            onSubmit({ ...value, speed: option });
                          }
                        }}
                        chain={chain}
                        transaction={transaction}
                      />
                    ),
                  };
                })}
              />
            </React.Suspense>
          </>
        ) : (
          <VStack
            gap={24}
            style={{ gridTemplateRows: 'auto 1fr', height: '100%' }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {customViewOnly ? (
                <form
                  method="dialog"
                  onSubmit={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Button
                    aria-label="Go back"
                    value={DialogButtonValue.cancel}
                    kind="ghost"
                    style={{
                      padding: 4,
                      position: 'absolute',
                      top: -4,
                      left: -8,
                    }}
                    size={32}
                  >
                    <ArrowLeftcon />
                  </Button>
                </form>
              ) : (
                <Button
                  aria-label="Go back"
                  onClick={() => setView('default')}
                  kind="ghost"
                  style={{
                    padding: 4,
                    position: 'absolute',
                    top: -4,
                    left: -8,
                  }}
                  size={32}
                >
                  <ArrowLeftcon />
                </Button>
              )}
              <UIText style={{ placeSelf: 'center' }} kind="body/accent">
                Custom Gas Price
              </UIText>
            </div>
            {chainGasPrices ? (
              <CustomNetworkFeeForm
                chain={chain}
                value={value}
                onSubmit={(value) => {
                  if (!customViewOnly) {
                    setView('default');
                  }
                  onSubmit(value);
                }}
                transaction={transaction}
                chainGasPrices={chainGasPrices}
              />
            ) : (
              <CircleSpinner />
            )}
          </VStack>
        )}
      </BottomSheetDialog>
    );
  }
);
