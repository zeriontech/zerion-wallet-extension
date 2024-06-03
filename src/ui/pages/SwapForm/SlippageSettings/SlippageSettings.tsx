import React, { useEffect, useRef, useState } from 'react';
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

const SLIPPAGE_OPTIONS = ['0.2', '0.5'];

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

function PercentWidth({ onValue }: { onValue(width: number): void }) {
  const persentCharWidthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (persentCharWidthRef.current) {
      onValue(persentCharWidthRef.current.clientWidth);
    } else {
      interval = setTimeout(
        () => onValue(persentCharWidthRef.current?.clientWidth || 0),
        100
      );
    }
    return () => clearTimeout(interval);
  }, [onValue]);

  return (
    <UIText
      ref={persentCharWidthRef}
      kind="body/accent"
      style={{ visibility: 'hidden', position: 'absolute' }}
    >
      %
    </UIText>
  );
}

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
        inset: '0 0 0 0',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {value ? (
        <UIText
          kind="body/accent"
          color={isOptimal ? undefined : 'var(--notice-500)'}
        >
          {value}%
        </UIText>
      ) : (
        <UIText kind="body/accent" color="var(--neutral-500)">
          Custom
        </UIText>
      )}
    </div>
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
  // const [customValue, setCustomValue] = useState(
  //   isCustomValue ? percentValue : ''
  // );
  const { isOptimal } = getSlippageWarning(percentValue);
  const [persentCharWidth, setPercentCharWidth] = useState(0);

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
            gridTemplateColumns: `repeat(${SLIPPAGE_OPTIONS.length}, 1fr) 1fr`,
            gap: 8,
          }}
        >
          {SLIPPAGE_OPTIONS.map((value) => (
            <Radio
              key={value}
              name="slippage"
              value={value}
              checked={!isCustomValue && value === percentValue}
              onChange={() => {
                setPercentValue(value);
                setIsCustomValue(false);
                // setCustomValue('');
              }}
              onFocus={() => {
                setIsCustomValue(false);
              }}
              required={!isCustomValue}
            >
              <UIText kind="body/accent">{`${value}%`}</UIText>
            </Radio>
          ))}
          <div style={{ position: 'relative' }}>
            <PercentWidth onValue={setPercentCharWidth} />
            {persentCharWidth ? (
              <CustomValueOverlay
                value={isCustomValue ? percentValue : null}
                isOptimal={isOptimal}
              />
            ) : null}
            <Input
              name="customSlippage"
              value={isCustomValue ? percentValue : ''}
              onFocus={() => {
                if (!isCustomValue) {
                  setPercentValue('');
                }
                setIsCustomValue(true);
              }}
              style={{
                textAlign: 'center',
                fontWeight: 500,
                border: isOptimal ? undefined : '1px solid var(--notice-500)',
                color: isOptimal ? undefined : 'var(--notice-500)',
                paddingRight: persentCharWidth + 12, // `%` width + input default padding,
              }}
              onChange={(event) => {
                setPercentValue(event.currentTarget.value);
                // setCustomValue(event.currentTarget.value);
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
            setPercentValue(SLIPPAGE_OPTIONS[1]);
            // setCustomValue('');
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
