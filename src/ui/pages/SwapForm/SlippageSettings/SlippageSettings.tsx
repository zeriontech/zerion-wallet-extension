import React, { useState } from 'react';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { apostrophe } from 'src/ui/shared/typography';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { isNumeric } from 'src/shared/isNumeric';
import type { CustomConfiguration } from '@zeriontech/transactions/lib/shared/user-configuration/types';
import * as styles from './styles.module.css';

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

const SLIPPAGE_OPTIONS = ['0.5', '1', '3'];

function SlippageWarning({ percentValue }: { percentValue: string }) {
  const isTooLarge = isNumeric(percentValue) && Number(percentValue) > 1;
  const isTooSmall = isNumeric(percentValue) && Number(percentValue) < 0.5;

  return (
    <Surface
      style={{
        visibility: isTooLarge || isTooSmall ? 'visible' : 'hidden',
        minHeight: 64, // prevent some jumping caused by different messages
        backgroundColor: 'var(--notice-100)',
        padding: 12,
        paddingInlineEnd: 16,
      }}
    >
      <HStack gap={12}>
        <WarningIcon
          size={32}
          outlineStrokeWidth={5}
          borderWidth="2px"
          glow={true}
        />
        <UIText kind="small/regular" color="var(--neutral-700)">
          {isTooLarge ? (
            <span>
              There{apostrophe}s a risk that another transaction could precede
              yours, potentially affecting the final price.
            </span>
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

export function SlippageSettings({
  configuration,
  onConfigurationChange,
}: {
  configuration: CustomConfiguration;
  onConfigurationChange: (value: CustomConfiguration) => void;
}) {
  const { slippage } = configuration;
  const [percentValue, setPercentValue] = useState(() =>
    String(toPercents(slippage))
  );
  const [isCustomValue, setIsCustomValue] = useState(
    () => !SLIPPAGE_OPTIONS.includes(percentValue)
  );
  return (
    <form
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SLIPPAGE_OPTIONS.length}, 1fr) 1fr`,
          gap: 8,
        }}
      >
        {SLIPPAGE_OPTIONS.map((value) => (
          <Radio
            name="slippage"
            value={value}
            checked={!isCustomValue && value === percentValue}
            onChange={() => {
              setPercentValue(value);
              setIsCustomValue(false);
            }}
            onFocus={() => {
              setIsCustomValue(false);
            }}
            required={!isCustomValue}
          >
            <UIText kind="body/accent">{`${value}%`}</UIText>
          </Radio>
        ))}
        <Input
          name="customSlippage"
          value={isCustomValue ? percentValue : ''}
          onFocus={() => {
            if (!isCustomValue) {
              setPercentValue('');
            }
            setIsCustomValue(true);
          }}
          onChange={(event) => setPercentValue(event.currentTarget.value)}
          pattern={FLOAT_INPUT_PATTERN}
          required={isCustomValue}
        />
      </div>
      <Spacer height={16} />
      <SlippageWarning percentValue={percentValue} />
      <Spacer height={32} />
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <Button
          kind="neutral"
          type="button"
          onClick={() => {
            setIsCustomValue(false);
            setPercentValue(SLIPPAGE_OPTIONS[0]);
          }}
        >
          Reset
        </Button>
        <Button kind="primary">Save</Button>
      </div>
    </form>
  );
}
