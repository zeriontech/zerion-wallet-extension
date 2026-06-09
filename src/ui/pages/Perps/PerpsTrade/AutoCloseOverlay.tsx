import React, { useCallback, useState } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import * as s from './styles.module.css';

type Mode = 'price' | 'pnl';
type Side = 'long' | 'short';
type Kind = 'tp' | 'sl';

interface AutoCloseValues {
  takeProfitPrice: string;
  stopLossPrice: string;
}

function clampDecimal(raw: string): string {
  const sanitized = raw.replace(/[^0-9.]/g, '');
  const firstDot = sanitized.indexOf('.');
  if (firstDot === -1) return sanitized;
  return (
    sanitized.slice(0, firstDot + 1) +
    sanitized.slice(firstDot + 1).replace(/\./g, '')
  );
}

// A take profit triggers on the winning side of entry; a stop loss on the
// losing side. Combined with the position side, this tells us whether the
// trigger price is above or below entry.
//   Long TP / Short SL → price goes up
//   Long SL / Short TP → price goes down
function isTriggerPriceAboveEntry(side: Side, kind: Kind): boolean {
  return (
    (side === 'long' && kind === 'tp') || (side === 'short' && kind === 'sl')
  );
}

// PnL % is computed on margin (not notional), so leverage scales it:
//   priceMove% = pnlPercent / leverage
function pnlPercentToPrice({
  pnlPercent,
  entryPrice,
  side,
  leverage,
  kind,
}: {
  pnlPercent: number;
  entryPrice: number;
  side: Side;
  leverage: number;
  kind: Kind;
}): string {
  if (!Number.isFinite(pnlPercent) || pnlPercent <= 0 || entryPrice <= 0)
    return '';
  const moveFraction = pnlPercent / 100 / Math.max(leverage, 1);
  const price = isTriggerPriceAboveEntry(side, kind)
    ? entryPrice * (1 + moveFraction)
    : entryPrice * (1 - moveFraction);
  return price > 0 ? price.toFixed(4) : '';
}

// Inverse of `pnlPercentToPrice`. The `kind` is required so a stop loss (whose
// trigger price sits on the losing side of entry) maps back to a positive PnL%
// magnitude instead of being treated as a negative number and discarded.
function priceToPnlPercent({
  price,
  entryPrice,
  side,
  leverage,
  kind,
}: {
  price: number;
  entryPrice: number;
  side: Side;
  leverage: number;
  kind: Kind;
}): string {
  if (!Number.isFinite(price) || price <= 0 || entryPrice <= 0) return '';
  const moveFraction = isTriggerPriceAboveEntry(side, kind)
    ? (price - entryPrice) / entryPrice
    : (entryPrice - price) / entryPrice;
  const pnlPercent = moveFraction * 100 * Math.max(leverage, 1);
  return pnlPercent > 0 ? pnlPercent.toFixed(2) : '';
}

interface DialogProps {
  initial: AutoCloseValues;
  /** Reference price used to convert PnL% into a trigger price. */
  entryPrice: number;
  side: Side;
  leverage: number;
  onConfirm: (values: AutoCloseValues) => void;
  onClose: () => void;
}

/**
 * The stateful body of the overlay. Mounted only while the dialog is open, so
 * its state is derived once from `initial` (via lazy useState initializers) and
 * never resynced — `entryPrice` ticking from the live mark price can't clobber
 * what the user is typing, and nothing persists between openings.
 */
function AutoCloseDialogBody({
  initial,
  entryPrice,
  side,
  leverage,
  onConfirm,
  onClose,
}: DialogProps) {
  // The overlay always opens in PnL view, hydrated from the stored prices.
  const [mode, setMode] = useState<Mode>('pnl');
  const [tp, setTp] = useState(() =>
    initial.takeProfitPrice
      ? priceToPnlPercent({
          price: Number(initial.takeProfitPrice),
          entryPrice,
          side,
          leverage,
          kind: 'tp',
        })
      : ''
  );
  const [sl, setSl] = useState(() =>
    initial.stopLossPrice
      ? priceToPnlPercent({
          price: Number(initial.stopLossPrice),
          entryPrice,
          side,
          leverage,
          kind: 'sl',
        })
      : ''
  );

  // Convert a single field's raw value between modes. Empty stays empty.
  const convertValue = useCallback(
    (value: string, from: Mode, to: Mode, kind: Kind): string => {
      if (!value || from === to) return value;
      return to === 'price'
        ? pnlPercentToPrice({
            pnlPercent: Number(value),
            entryPrice,
            side,
            leverage,
            kind,
          })
        : priceToPnlPercent({
            price: Number(value),
            entryPrice,
            side,
            leverage,
            kind,
          });
    },
    [entryPrice, side, leverage]
  );

  const handleModeChange = useCallback(
    (next: Mode) => {
      if (next === mode) return;
      // Convert both fields from the current mode to the next one. Setters are
      // called at the top level (never nested inside another updater) so they
      // stay pure and run exactly once.
      setTp((value) => convertValue(value, mode, next, 'tp'));
      setSl((value) => convertValue(value, mode, next, 'sl'));
      setMode(next);
    },
    [mode, convertValue]
  );

  const handleTpChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setTp(clampDecimal(e.currentTarget.value)),
    []
  );

  const handleSlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSl(clampDecimal(e.currentTarget.value)),
    []
  );

  const handleConfirm = useCallback(() => {
    onConfirm({
      takeProfitPrice: convertValue(tp, mode, 'price', 'tp'),
      stopLossPrice: convertValue(sl, mode, 'price', 'sl'),
    });
    onClose();
  }, [tp, sl, mode, convertValue, onConfirm, onClose]);

  const handleClear = useCallback(() => {
    onConfirm({ takeProfitPrice: '', stopLossPrice: '' });
    onClose();
  }, [onConfirm, onClose]);

  const unit = mode === 'price' ? '$' : '%';

  return (
    <VStack gap={20} style={{ padding: 24 }}>
      <SegmentedControlGroup kind="secondary">
        <SegmentedControlRadio
          name="auto-close-mode"
          value="pnl"
          checked={mode === 'pnl'}
          onChange={() => handleModeChange('pnl')}
        >
          PnL %
        </SegmentedControlRadio>
        <SegmentedControlRadio
          name="auto-close-mode"
          value="price"
          checked={mode === 'price'}
          onChange={() => handleModeChange('price')}
        >
          Price
        </SegmentedControlRadio>
      </SegmentedControlGroup>

      <VStack gap={8}>
        <UIText kind="small/accent">Take profit</UIText>
        <div className={s.autoCloseRow}>
          <span className={s.autoCloseUnit}>{unit}</span>
          <UnstyledInput
            inputMode="decimal"
            placeholder="0"
            value={tp}
            onChange={handleTpChange}
            className={s.autoCloseInput}
          />
        </div>
      </VStack>

      <VStack gap={8}>
        <UIText kind="small/accent">Stop loss</UIText>
        <div className={s.autoCloseRow}>
          <span className={s.autoCloseUnit}>{unit}</span>
          <UnstyledInput
            inputMode="decimal"
            placeholder="0"
            value={sl}
            onChange={handleSlChange}
            className={s.autoCloseInput}
          />
        </div>
      </VStack>

      <div className={s.autoCloseFooter}>
        <Button kind="regular" size={48} onClick={handleClear}>
          Clear
        </Button>
        <Button kind="primary" size={48} onClick={handleConfirm}>
          Save
        </Button>
      </div>
    </VStack>
  );
}

export function AutoCloseOverlay({
  open,
  ...rest
}: DialogProps & { open: boolean }) {
  return (
    <Dialog2
      open={open}
      onClose={rest.onClose}
      title="Auto-close"
      size="content"
    >
      {/* Mount the stateful body only while open so it re-derives its initial
          state from `initial` on every opening and never persists it. */}
      {open ? <AutoCloseDialogBody {...rest} /> : null}
    </Dialog2>
  );
}
