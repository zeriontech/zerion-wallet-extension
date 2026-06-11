import React, { useState } from 'react';
import { PERPS_SCREEN } from 'src/shared/types/perps-events';
import { emitter } from 'src/ui/shared/events';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import * as s from './styles.module.css';

const PRESETS = [1, 2, 5, 10, 25] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function LeverageOverlay({
  open,
  initialLeverage,
  maxLeverage,
  onConfirm,
  onClose,
}: {
  open: boolean;
  initialLeverage: number;
  maxLeverage: number;
  onConfirm: (leverage: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialLeverage);

  // Reset value to the latest external state whenever the overlay is reopened.
  React.useEffect(() => {
    if (open) setValue(clamp(initialLeverage, 1, maxLeverage));
  }, [open, initialLeverage, maxLeverage]);

  React.useEffect(() => {
    if (open) {
      emitter.emit('perpsScreenViewed', {
        screen_name: PERPS_SCREEN.AdjustLeverage,
      });
    }
  }, [open]);

  const chips = Array.from(
    new Set([...PRESETS.filter((p) => p <= maxLeverage), maxLeverage])
  ).sort((a, b) => a - b);

  return (
    <Dialog2 open={open} onClose={onClose} title="Leverage" size="content">
      <VStack gap={24} style={{ padding: 24 }}>
        <VStack gap={8} style={{ alignItems: 'center' }}>
          <UIText kind="headline/h1">{value}x</UIText>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            Max {maxLeverage}x
          </UIText>
        </VStack>

        <input
          type="range"
          min={1}
          max={maxLeverage}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.currentTarget.value))}
          className={s.slider}
          aria-label="Leverage"
        />

        <HStack gap={8} style={{ flexWrap: 'wrap' }}>
          {chips.map((chip) => (
            <UnstyledButton
              key={chip}
              type="button"
              className={
                value === chip
                  ? `${s.leverageChip} ${s.leverageChipActive}`
                  : s.leverageChip
              }
              onClick={() => setValue(chip)}
            >
              {chip === maxLeverage && chip !== 25
                ? `${chip}x · Max`
                : `${chip}x`}
            </UnstyledButton>
          ))}
        </HStack>

        <Button
          kind="primary"
          size={48}
          onClick={() => {
            onConfirm(value);
            onClose();
          }}
        >
          Set leverage
        </Button>
      </VStack>
    </Dialog2>
  );
}
