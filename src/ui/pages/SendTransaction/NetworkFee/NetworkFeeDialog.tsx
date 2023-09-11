import React, { useMemo, useState } from 'react';
import type { BigNumber } from 'bignumber.js';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
// import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import ArrowLeftcon from 'jsx:src/ui/assets/arrow-left.svg';
import type { Chain } from 'src/modules/networks/Chain';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
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
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { invariant } from 'src/shared/invariant';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';
import type { NetworkFeeConfiguration, NetworkFeeSpeed } from './types';
import { NetworkFeeIcon } from './NetworkFeeIcon';
import { NETWORK_SPEED_TO_TITLE } from './constants';

const OPTIONS: NetworkFeeSpeed[] = ['fast', 'standard', 'custom'];

function getCustomFeeDescription({
  fiat,
  gasPrice,
}: {
  fiat?: BigNumber.Value;
  gasPrice: number | string;
}) {
  return `${
    fiat ? `${formatCurrencyValue(fiat, 'en', 'usd')} (` : ''
  }${formatGasPrice(gasPrice)}${fiat ? ')' : ''}`;
}

function formDataToGasConfiguration(
  formData: FormData
): NetworkFeeConfiguration {
  const priorityFee = (formData.get('priorityFee') ?? '') as string;
  const maxFee = (formData.get('maxFee') ?? '') as string;
  const baseFee = (formData.get('baseFee') ?? '') as string;

  if (formData.has('baseFee')) {
    return {
      speed: 'custom',
      custom1559GasPrice: null,
      customClassicGasPrice: gweiToWei(baseFee),
    };
  } else {
    return {
      speed: 'custom',
      customClassicGasPrice: null,
      custom1559GasPrice: {
        priority_fee: gweiToWei(priorityFee),
        max_fee: gweiToWei(maxFee),
      },
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

const FLOAT_INPUT_PATTERN = '(\\d+\\.)?\\d+'; // positive floats and ints

function CustomNetworkFeeForm({
  type,
  chain,
  value,
  chainGasPrices,
  onSubmit,
  transaction,
}: {
  type: 'eip1559' | 'classic';
  chain: Chain;
  value: NetworkFeeConfiguration;
  chainGasPrices: ChainGasPrice;
  onSubmit(value: NetworkFeeConfiguration): void;
  transaction: IncomingTransaction;
}) {
  const { eip1559, classic } = chainGasPrices.info;
  if (type === 'eip1559' && !eip1559) {
    throw new Error('eip1559 gas price is expected in chain configuration');
  }
  if (type === 'classic' && !classic) {
    throw new Error('classic gas price is expected in chain configuration');
  }

  const [configuration, setConfiguration] = useState(value);

  const { value: nativeAsset } = useNativeAsset(chain);

  const defaultBaseFee = value.customClassicGasPrice ?? classic?.fast ?? 0;
  const defaultPriorityFee =
    value.custom1559GasPrice?.priority_fee ?? eip1559?.fast?.priority_fee ?? 0;
  const defaultMaxFee =
    value.custom1559GasPrice?.max_fee ?? eip1559?.fast?.max_fee ?? 0;

  const defaultBaseFeeGWEI = weiToGwei(defaultBaseFee);
  const defaultPriorityFeeGWEI = weiToGwei(defaultPriorityFee);
  const defaultMaxFeeGWEI = weiToGwei(defaultMaxFee);

  const baseFee = configuration.customClassicGasPrice ?? defaultBaseFee;
  const priorityFee =
    configuration.custom1559GasPrice?.priority_fee ?? defaultPriorityFee;
  const maxFee = configuration.custom1559GasPrice?.max_fee ?? defaultMaxFee;

  const { priorityFeeFiat, maxFeeFiat, baseFeeFiat } = useMemo(() => {
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
      priorityFeeFiat: getFiatValue(
        (priorityFee || 0) + (eip1559?.base_fee || 0)
      ),
      maxFeeFiat: getFiatValue(maxFee),
      baseFeeFiat: getFiatValue(baseFee),
    };
  }, [nativeAsset, priorityFee, maxFee, baseFee, eip1559, transaction, chain]);

  return (
    <form
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
                {formatGasPrice(eip1559.base_fee)}
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
          <VStack gap={8}>
            <HStack gap={24} justifyContent="space-between">
              <UIText kind="small/regular">Expected Fee</UIText>
              <UIText kind="small/accent">
                {getCustomFeeDescription({
                  fiat: priorityFeeFiat,
                  gasPrice: eip1559.base_fee + (priorityFee || 0),
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
              setFormValue(form, 'baseFee', weiToGwei(classic?.fast || 0));
            } else {
              const priorityFee = weiToGwei(eip1559?.fast?.priority_fee || 0);
              setFormValue(form, 'priorityFee', priorityFee);
              const maxFee = weiToGwei(eip1559?.fast?.max_fee || 0);
              setFormValue(form, 'maxFee', maxFee);
            }
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
  transaction: IncomingTransaction;
}) {
  const { networks } = useNetworks();
  const speedConfiguration = useMemo(() => {
    return {
      ...networkFeeConfiguration,
      speed: option,
    };
  }, [networkFeeConfiguration, option]);

  const { costs, costsQuery } = useTransactionFee({
    chain,
    transaction,
    networkFeeConfiguration: speedConfiguration,
  });
  const { feeValueFiat, feeValueCommon } = costs || {};

  const seconds =
    option !== 'custom'
      ? chainGasPrices?.info.eip1559?.[option]?.estimation_seconds
      : undefined;

  const selected = option === networkFeeConfiguration.speed;
  const nativeAssetSymbol =
    networks?.getNetworkByName(chain)?.native_asset?.symbol;

  return (
    <SurfaceItemButton
      style={{ height: 48, borderRadius: 12, paddingInline: 0 }}
      outlined={selected}
      onClick={onClick}
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
            ~{formatCurrencyValue(feeValueFiat, 'en', 'usd')}
          </UIText>
        ) : feeValueCommon && nativeAssetSymbol ? (
          <UIText
            kind="small/regular"
            color={selected ? 'var(--primary)' : 'var(--black)'}
          >
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
    transaction: IncomingTransaction;
  }
>(({ onSubmit, value, chain, transaction }, ref) => {
  const [view, setView] = useState<'eip1559' | 'classic' | 'default'>(
    'default'
  );

  const dialogHeight = view === 'default' ? '230px' : '90vh';
  const { data: chainGasPrices } = useGasPrices(chain);

  const gasPriceType = chainGasPrices?.info.eip1559 ? 'eip1559' : 'classic';

  return (
    <BottomSheetDialog
      ref={ref}
      height={dialogHeight}
      containerStyle={{
        ['--surface-background-color' as string]: 'var(--z-index-1)',
      }}
    >
      {view === 'default' ? (
        <>
          <DialogTitle
            alignTitle="start"
            title={
              <HStack gap={8} alignItems="center">
                <UIText kind="headline/h3">Network Fee</UIText>
                {/* <div
                  style={{ display: 'flex' }}
                  title={`The fee required to successfully conduct a transaction on the ${chain.toString()} blockchain`}
                >
                  <QuestionHintIcon style={{ color: 'var(--neutral-500)' }} />
                </div> */}
              </HStack>
            }
            closeKind="icon"
          />
          <Spacer height={10} />
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
                        setView(gasPriceType);
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
            <Button
              aria-label="Go back"
              onClick={() => setView('default')}
              kind="ghost"
              style={{ padding: 4, position: 'absolute', top: -4, left: -8 }}
              size={32}
            >
              <ArrowLeftcon />
            </Button>
            <UIText style={{ placeSelf: 'center' }} kind="body/accent">
              Custom Gas Price
            </UIText>
          </div>
          {chainGasPrices ? (
            <CustomNetworkFeeForm
              type={view}
              chain={chain}
              value={value}
              onSubmit={(value) => {
                setView('default');
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
});
