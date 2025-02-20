import React, { useState } from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { isNumeric } from 'src/shared/isNumeric';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Chain } from 'src/modules/networks/Chain';
import * as styles from './styles.module.css';
import { getSlippageOptions } from './getSlippageOptions';

function Radio({
  name,
  checked,
  value,
  onChange,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> &
  Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    'name' | 'checked' | 'value' | 'onChange' | 'required'
  >) {
  return (
    <label {...props} className={styles.radio}>
      <input
        type="radio"
        name={name}
        checked={checked}
        value={value}
        onChange={onChange}
        required={required}
      />
      {children}
    </label>
  );
}

function toPercents(value: number) {
  return value * 100;
}

function fromPercents(value: number) {
  return value / 100;
}

function getSlippageWarning(percentValue: string) {
  const isTooLarge = isNumeric(percentValue) && Number(percentValue) > 1;
  const isTooSmall = isNumeric(percentValue) && Number(percentValue) < 0.2;
  return { isTooLarge, isTooSmall, isOptimal: !isTooLarge && !isTooSmall };
}

function SlippageWarning({ percentValue }: { percentValue: string }) {
  const { isTooLarge, isTooSmall, isOptimal } =
    getSlippageWarning(percentValue);

  if (isOptimal) {
    return null;
  }

  return (
    <Surface
      style={{
        backgroundColor: 'var(--notice-100)',
        padding: 12,
        paddingInlineEnd: 16,
      }}
    >
      <HStack gap={12} alignItems="center">
        <WarningIcon
          size={32}
          outlineStrokeWidth={5}
          borderWidth="2px"
          glow={true}
        />
        <UIText kind="small/regular" color="var(--neutral-700)">
          {isTooLarge ? (
            <span>You may receive up to {percentValue}% less tokens</span>
          ) : isTooSmall ? (
            <span>
              Transaction may potentially fail due to the volatility of asset
              prices.
            </span>
          ) : (
            <br />
          )}
        </UIText>
      </HStack>
    </Surface>
  );
}

const INPUT_TEXT_KIND = 'body/accent';

function CustomValueOverlay({
  isOptimal,
  value,
}: {
  isOptimal: boolean;
  value: string | null;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '0 12px 0 12px',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {value != null ? (
        <UIText
          kind={INPUT_TEXT_KIND}
          color={isOptimal ? undefined : 'var(--notice-500)'}
          style={{
            textAlign: 'right',
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ color: 'transparent' }}>{value}</span>%
        </UIText>
      ) : (
        <UIText kind={INPUT_TEXT_KIND} color="var(--neutral-500)">
          Custom
        </UIText>
      )}
    </div>
  );
}

export function SlippageSettings({
  chain,
  configuration,
  onConfigurationChange,
}: {
  chain: Chain;
  configuration: CustomConfiguration;
  onConfigurationChange: (value: CustomConfiguration) => void;
}) {
  const { slippage: userSlippage } = configuration;
  const { default: defaultSlippagePercent, options: slippageOptions } =
    getSlippageOptions(chain);

  const slippage = String(
    userSlippage ? toPercents(userSlippage) : defaultSlippagePercent
  );

  const [percentValue, setPercentValue] = useState(slippage);
  const [isCustomValue, setIsCustomValue] = useState(
    () => !slippageOptions.includes(Number(percentValue))
  );
  const [isCustomValueFocused, setIsCustomValueFocused] = useState(false);
  const { isOptimal } = getSlippageWarning(percentValue);

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      onSubmit={(event) => {
        event.preventDefault();
        if (event.currentTarget.checkValidity()) {
          onConfigurationChange({
            ...configuration,
            slippage: fromPercents(Number(percentValue)),
          });
        }
      }}
    >
      <VStack gap={16} style={{ alignContent: 'start', flexGrow: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${slippageOptions.length}, 1fr) 1fr`,
            gap: 8,
          }}
        >
          {slippageOptions.map((value) => (
            <Radio
              key={value}
              name="slippage"
              value={value}
              checked={!isCustomValue && String(value) === percentValue}
              onChange={() => {
                setPercentValue(String(value));
                setIsCustomValue(false);
              }}
              onFocus={() => {
                setIsCustomValue(false);
              }}
              required={!isCustomValue}
            >
              <UIText kind={INPUT_TEXT_KIND}>{`${value}%`}</UIText>
            </Radio>
          ))}
          <div style={{ position: 'relative' }}>
            <CustomValueOverlay
              value={
                isCustomValue
                  ? percentValue || (isCustomValueFocused ? '' : null)
                  : null
              }
              isOptimal={isOptimal}
            />
            <Input
              name="customSlippage"
              value={isCustomValue ? percentValue : ''}
              onFocus={() => {
                setIsCustomValueFocused(true);
                if (!isCustomValue) {
                  setPercentValue('');
                }
                setIsCustomValue(true);
              }}
              onBlur={() => {
                setIsCustomValueFocused(false);
              }}
              style={{
                textAlign: 'center',
                fontWeight: 500,
                border: isOptimal ? undefined : '1px solid var(--notice-500)',
                color: isOptimal ? undefined : 'var(--notice-500)',
                paddingRight: 'calc(1em + 12px)', // `%` width + input default padding,
              }}
              onChange={(event) => {
                setPercentValue(event.currentTarget.value);
              }}
              pattern={FLOAT_INPUT_PATTERN}
              required={isCustomValue}
            />
          </div>
        </div>
        <SlippageWarning percentValue={percentValue} />
        <UIText kind="body/regular" color="var(--neutral-500)">
          Your transaction will fail if the price changes more than the
          slippage.
        </UIText>
      </VStack>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <Button
          kind="neutral"
          type="button"
          onClick={() => {
            setIsCustomValue(false);
            setPercentValue(String(defaultSlippagePercent));
          }}
        >
          Reset
        </Button>
        <Button kind="primary" style={{ paddingInline: 8 }}>
          Save For This Trade
        </Button>
      </div>
    </form>
  );
}
