import React, { useRef, useState } from 'react';
import type {
  CustomConfiguration,
  NetworkFeeConfiguration,
} from '@zeriontech/transactions';
import { gweiToWei, weiToGweiStr } from 'src/shared/units/formatGasPrice';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { InnerLabelInput } from 'src/ui/ui-kit/Input/InnerLabelInput';
import {
  FLOAT_INPUT_PATTERN,
  INT_INPUT_PATTERN,
} from 'src/ui/shared/forms/inputs';
import { apostrophe } from 'src/ui/shared/typography';
import { formDataToGasConfiguration } from 'src/ui/pages/SendTransaction/NetworkFee/NetworkFeeDialog';
import { getEffectiveGasPrice } from '../getEffectiveGasPrice';
import {
  getCustomFeeRatio,
  type NetworkFeeQuote,
} from '../getNetworkFeeForSpeed';
import { formatNetworkFee } from '../formatNetworkFee';

const EIP1559_FALLBACK = {
  priorityFee: '1.5',
  maxFee: '30',
  gasLimit: '21000',
};

const CLASSIC_FALLBACK = {
  baseFee: '20',
  gasLimit: '21000',
};

/**
 * Quote-derived (or user-override-derived) default values in GWEI for the
 * custom form, taking precedence over the hardcoded fallbacks. Any missing
 * field falls back to the constants above.
 */
export interface CustomFormDefaults {
  priorityFee?: string | null;
  maxFee?: string | null;
  baseFee?: string | null;
  gasLimit?: string | null;
}

const NO_VALUE = '—';

/** Parse a GWEI input string to wei (number), or `null` if empty/invalid. */
function gweiInputToWei(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? gweiToWei(num) : null;
}

/** Parse a decimal input string to a number, or `null` if empty/invalid. */
function decimalInput(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

const setPatternValidity =
  (message: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.validity.patternMismatch) {
      event.currentTarget.setCustomValidity(message);
    } else {
      event.currentTarget.setCustomValidity('');
    }
  };

const setGasPriceValidationMessage = setPatternValidity(
  'Gas Price value must be a positive number'
);
const setGasLimitValidationMessage = setPatternValidity(
  'Gas Limit value must be a natural number'
);

function setFormValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);
  if (input instanceof HTMLInputElement) {
    input.value = value;
  }
}

function DisplayRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <HStack gap={24} justifyContent="space-between">
      <UIText kind="small/regular">{label}</UIText>
      <UIText kind="small/accent">{value}</UIText>
    </HStack>
  );
}

/**
 * A clickable "Recommended value: N" hint shown under the Gas Limit input. The
 * recommended value is the quote's own gas limit; clicking it fills the field.
 * When the entered value is significantly lower than the recommendation, the
 * hint turns into a warning.
 */
function RecommendedGasLimit({
  value,
  showWarning,
  onApply,
}: {
  value: string;
  showWarning: boolean;
  onApply: (value: string) => void;
}) {
  return (
    <UIText
      kind="caption/regular"
      color={showWarning ? 'var(--notice-500)' : 'var(--neutral-500)'}
      style={{ paddingInline: 2 }}
    >
      Recommended value:{' '}
      <UnstyledButton
        type="button"
        style={{ color: 'var(--primary)' }}
        onClick={() => onApply(value)}
      >
        {value}
      </UnstyledButton>
      .
      {showWarning
        ? ` We don${apostrophe}t recommend using a gas limit significantly lower than the recommended value.`
        : null}
    </UIText>
  );
}

/** Convert a wei value (number) to a GWEI string, or `null` if not present. */
function weiToGweiOrNull(value: number | null | undefined): string | null {
  return value != null ? weiToGweiStr(value) : null;
}

export function NetworkFeeCustomForm({
  isEip1559,
  defaults,
  configuration,
  quote = null,
  baseFee = null,
  onSubmit,
}: {
  isEip1559: boolean;
  defaults?: CustomFormDefaults;
  /**
   * The current configuration. When it already holds custom (`speed: 'custom'`)
   * values, those seed the form inputs, taking precedence over the quote
   * defaults. Reset still falls back to the quote defaults.
   */
  configuration?: CustomConfiguration;
  /** Active quote, used to scale the live expected/max fee estimates. */
  quote?: NetworkFeeQuote | null;
  /** Current EIP-1559 base fee (wei), used to compute the effective price. */
  baseFee?: number | null;
  onSubmit: (value: NetworkFeeConfiguration) => void;
}) {
  // Quote-derived defaults (above the hardcoded fallbacks). The Reset button
  // restores these.
  const eip1559Defaults = {
    priorityFee: defaults?.priorityFee || EIP1559_FALLBACK.priorityFee,
    maxFee: defaults?.maxFee || EIP1559_FALLBACK.maxFee,
    gasLimit: defaults?.gasLimit || EIP1559_FALLBACK.gasLimit,
  };
  const classicDefaults = {
    baseFee: defaults?.baseFee || CLASSIC_FALLBACK.baseFee,
    gasLimit: defaults?.gasLimit || CLASSIC_FALLBACK.gasLimit,
  };

  // Existing custom override (in wei), converted to GWEI strings. These seed the
  // inputs above the quote defaults so a previously-saved custom fee is shown
  // when the form reopens.
  const customNetworkFee =
    configuration?.networkFee.speed === 'custom'
      ? configuration.networkFee
      : null;
  const custom = {
    priorityFee: weiToGweiOrNull(
      customNetworkFee?.custom1559GasPrice?.priorityFee
    ),
    maxFee: weiToGweiOrNull(customNetworkFee?.custom1559GasPrice?.maxFee),
    classicGasPrice: weiToGweiOrNull(customNetworkFee?.customClassicGasPrice),
    gasLimit: customNetworkFee?.gasLimit || null,
  };

  // Initial input values: custom override OR quote defaults.
  const eip1559Initial = {
    priorityFee: custom.priorityFee || eip1559Defaults.priorityFee,
    maxFee: custom.maxFee || eip1559Defaults.maxFee,
    gasLimit: custom.gasLimit || eip1559Defaults.gasLimit,
  };
  const classicInitial = {
    baseFee: custom.classicGasPrice || classicDefaults.baseFee,
    gasLimit: custom.gasLimit || classicDefaults.gasLimit,
  };

  const formRef = useRef<HTMLFormElement | null>(null);

  // Live input values (GWEI / decimal strings), seeded from the initial values
  // (custom override OR quote defaults), then updated on every keystroke.
  const [values, setValues] = useState({
    priorityFee: eip1559Initial.priorityFee,
    maxFee: eip1559Initial.maxFee,
    classicGasPrice: classicInitial.baseFee,
    gasLimit: isEip1559 ? eip1559Initial.gasLimit : classicInitial.gasLimit,
  });
  const trackValue =
    (name: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;
      setValues((prev) => ({ ...prev, [name]: value }));
    };

  /** Apply a gas-limit value to both the live state and the form input. */
  const applyGasLimit = (form: HTMLFormElement | null, value: string) => {
    if (form) {
      setFormValue(form, 'gasLimit', value);
    }
    setValues((prev) => ({ ...prev, gasLimit: value }));
  };

  const gasLimitNum = decimalInput(values.gasLimit);

  // The quote's own gas limit is the recommended value. Clicking the hint
  // fills the input with it; entering a value significantly lower than it
  // (more than ~10% below) shows a warning.
  const recommendedGasLimit = defaults?.gasLimit || null;
  const recommendedGasLimitNum = recommendedGasLimit
    ? decimalInput(recommendedGasLimit)
    : null;
  const showLowGasLimitWarning =
    recommendedGasLimitNum != null &&
    gasLimitNum != null &&
    gasLimitNum * 1.1 < recommendedGasLimitNum;

  // Expected fee: effective price (capped by maxFee for 1559) × gas limit.
  // Max fee (1559 only): maxFee × gas limit. Both scale from the quote's
  // bundled networkFee.amount via getCustomFeeRatio. `null` when not computable.
  let expectedFee: string | null = null;
  let maxFeeDisplay: string | null = null;
  if (quote) {
    if (isEip1559) {
      const maxFeeWei = gweiInputToWei(values.maxFee);
      const priorityWei = gweiInputToWei(values.priorityFee);
      const effective = getEffectiveGasPrice(
        { maxFee: maxFeeWei, maxPriorityFee: priorityWei },
        baseFee
      );
      expectedFee = formatNetworkFee(
        quote,
        getCustomFeeRatio(quote, effective, gasLimitNum, baseFee)
      );
      maxFeeDisplay = formatNetworkFee(
        quote,
        getCustomFeeRatio(quote, maxFeeWei, gasLimitNum, baseFee)
      );
    } else {
      const gasPriceWei = gweiInputToWei(values.classicGasPrice);
      expectedFee = formatNetworkFee(
        quote,
        getCustomFeeRatio(quote, gasPriceWei, gasLimitNum, baseFee)
      );
    }
  }

  const baseFeeDisplay =
    baseFee != null ? `~${weiToGweiStr(baseFee)} GWEI` : NO_VALUE;

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity()) {
          onSubmit(formDataToGasConfiguration(new FormData(form)));
        }
      }}
    >
      <VStack gap={16} style={{ alignContent: 'start' }}>
        {isEip1559 ? (
          <>
            <VStack gap={12}>
              <DisplayRow label="Base Fee" value={baseFeeDisplay} />
              <div
                style={{
                  width: '100%',
                  height: 1,
                  backgroundColor: 'var(--neutral-300)',
                }}
              />
            </VStack>
            <HStack gap={16} style={{ gridTemplateColumns: '1fr 1fr' }}>
              <InnerLabelInput
                inputMode="numeric"
                label="Priority Fee (GWEI)"
                name="priorityFee"
                placeholder="0"
                style={{ border: '1px solid var(--neutral-400)' }}
                defaultValue={eip1559Initial.priorityFee}
                onChange={(event) => {
                  setGasPriceValidationMessage(event);
                  trackValue('priorityFee')(event);
                }}
                pattern={FLOAT_INPUT_PATTERN}
                required={true}
              />
              <InnerLabelInput
                inputMode="numeric"
                label="Max Fee (GWEI)"
                name="maxFee"
                placeholder="0"
                style={{ border: '1px solid var(--neutral-400)' }}
                defaultValue={eip1559Initial.maxFee}
                onChange={(event) => {
                  setGasPriceValidationMessage(event);
                  trackValue('maxFee')(event);
                }}
                pattern={FLOAT_INPUT_PATTERN}
                required={true}
              />
            </HStack>
            <VStack gap={4}>
              <InnerLabelInput
                inputMode="numeric"
                label="Gas Limit"
                name="gasLimit"
                placeholder="0"
                style={{
                  border: showLowGasLimitWarning
                    ? '1px solid var(--notice-500)'
                    : '1px solid var(--neutral-400)',
                }}
                defaultValue={eip1559Initial.gasLimit}
                pattern={INT_INPUT_PATTERN}
                onChange={(event) => {
                  setGasLimitValidationMessage(event);
                  trackValue('gasLimit')(event);
                }}
                required={true}
              />
              {recommendedGasLimit ? (
                <RecommendedGasLimit
                  value={recommendedGasLimit}
                  showWarning={showLowGasLimitWarning}
                  onApply={(value) => applyGasLimit(formRef.current, value)}
                />
              ) : null}
            </VStack>
            <VStack gap={8}>
              <DisplayRow
                label="Expected Fee"
                value={expectedFee ?? NO_VALUE}
              />
              <DisplayRow label="Max Fee" value={maxFeeDisplay ?? NO_VALUE} />
            </VStack>
          </>
        ) : (
          <>
            <InnerLabelInput
              inputMode="numeric"
              label="Base Fee (GWEI)"
              name="baseFee"
              placeholder="0"
              style={{ border: '1px solid var(--neutral-400)' }}
              defaultValue={classicInitial.baseFee}
              onChange={(event) => {
                setGasPriceValidationMessage(event);
                trackValue('classicGasPrice')(event);
              }}
              pattern={FLOAT_INPUT_PATTERN}
              required={true}
            />
            <VStack gap={4}>
              <InnerLabelInput
                inputMode="numeric"
                label="Gas Limit"
                name="gasLimit"
                placeholder="0"
                style={{
                  border: showLowGasLimitWarning
                    ? '1px solid var(--notice-500)'
                    : '1px solid var(--neutral-400)',
                }}
                defaultValue={classicInitial.gasLimit}
                pattern={INT_INPUT_PATTERN}
                onChange={(event) => {
                  setGasLimitValidationMessage(event);
                  trackValue('gasLimit')(event);
                }}
                required={true}
              />
              {recommendedGasLimit ? (
                <RecommendedGasLimit
                  value={recommendedGasLimit}
                  showWarning={showLowGasLimitWarning}
                  onApply={(value) => applyGasLimit(formRef.current, value)}
                />
              ) : null}
            </VStack>
            <DisplayRow label="Expected Fee" value={expectedFee ?? NO_VALUE} />
          </>
        )}
        <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Button
            type="button"
            kind="regular"
            onClick={(event) => {
              const { form } = event.currentTarget;
              if (!form) return;
              if (isEip1559) {
                setFormValue(form, 'priorityFee', eip1559Defaults.priorityFee);
                setFormValue(form, 'maxFee', eip1559Defaults.maxFee);
                setFormValue(form, 'gasLimit', eip1559Defaults.gasLimit);
                setValues((prev) => ({
                  ...prev,
                  priorityFee: eip1559Defaults.priorityFee,
                  maxFee: eip1559Defaults.maxFee,
                  gasLimit: eip1559Defaults.gasLimit,
                }));
              } else {
                setFormValue(form, 'baseFee', classicDefaults.baseFee);
                setFormValue(form, 'gasLimit', classicDefaults.gasLimit);
                setValues((prev) => ({
                  ...prev,
                  classicGasPrice: classicDefaults.baseFee,
                  gasLimit: classicDefaults.gasLimit,
                }));
              }
            }}
          >
            Reset
          </Button>
          <Button kind="primary">Save</Button>
        </HStack>
      </VStack>
    </form>
  );
}
