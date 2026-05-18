import React, { useState } from 'react';
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
  kind: 'tp' | 'sl';
}): string {
  if (!Number.isFinite(pnlPercent) || pnlPercent <= 0 || entryPrice <= 0)
    return '';
  const moveFraction = pnlPercent / 100 / Math.max(leverage, 1);
  // Long TP / Short SL → price goes up. Long SL / Short TP → price goes down.
  const priceUp =
    (side === 'long' && kind === 'tp') || (side === 'short' && kind === 'sl');
  const price = priceUp
    ? entryPrice * (1 + moveFraction)
    : entryPrice * (1 - moveFraction);
  return price > 0 ? price.toFixed(4) : '';
}

function priceToPnlPercent({
  price,
  entryPrice,
  side,
  leverage,
}: {
  price: number;
  entryPrice: number;
  side: Side;
  leverage: number;
}): string {
  if (!Number.isFinite(price) || price <= 0 || entryPrice <= 0) return '';
  const moveFraction =
    side === 'long'
      ? (price - entryPrice) / entryPrice
      : (entryPrice - price) / entryPrice;
  const pnlPercent = moveFraction * 100 * Math.max(leverage, 1);
  return pnlPercent > 0 ? pnlPercent.toFixed(2) : '';
}

export function AutoCloseOverlay({
  open,
  initial,
  entryPrice,
  side,
  leverage,
  onConfirm,
  onClose,
}: {
  open: boolean;
  initial: AutoCloseValues;
  /** Reference price used to convert PnL% into a trigger price. */
  entryPrice: number;
  side: Side;
  leverage: number;
  onConfirm: (values: AutoCloseValues) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>('pnl');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');

  // When the overlay opens, hydrate from the URL values (which are stored as
  // prices). For the PnL view, derive the % back from the price.
  React.useEffect(() => {
    if (!open) return;
    setMode('pnl');
    setTp(
      initial.takeProfitPrice
        ? priceToPnlPercent({
            price: Number(initial.takeProfitPrice),
            entryPrice,
            side,
            leverage,
          })
        : ''
    );
    setSl(
      initial.stopLossPrice
        ? priceToPnlPercent({
            price: Number(initial.stopLossPrice),
            entryPrice,
            side,
            leverage,
          })
        : ''
    );
  }, [
    open,
    initial.takeProfitPrice,
    initial.stopLossPrice,
    entryPrice,
    side,
    leverage,
  ]);

  function handleModeChange(next: Mode) {
    if (next === mode) return;
    // Convert current values to the new mode.
    if (next === 'price') {
      setTp(
        tp
          ? pnlPercentToPrice({
              pnlPercent: Number(tp),
              entryPrice,
              side,
              leverage,
              kind: 'tp',
            })
          : ''
      );
      setSl(
        sl
          ? pnlPercentToPrice({
              pnlPercent: Number(sl),
              entryPrice,
              side,
              leverage,
              kind: 'sl',
            })
          : ''
      );
    } else {
      setTp(
        tp
          ? priceToPnlPercent({ price: Number(tp), entryPrice, side, leverage })
          : ''
      );
      setSl(
        sl
          ? priceToPnlPercent({ price: Number(sl), entryPrice, side, leverage })
          : ''
      );
    }
    setMode(next);
  }

  function handleConfirm() {
    let tpPrice = '';
    let slPrice = '';
    if (tp) {
      tpPrice =
        mode === 'price'
          ? tp
          : pnlPercentToPrice({
              pnlPercent: Number(tp),
              entryPrice,
              side,
              leverage,
              kind: 'tp',
            });
    }
    if (sl) {
      slPrice =
        mode === 'price'
          ? sl
          : pnlPercentToPrice({
              pnlPercent: Number(sl),
              entryPrice,
              side,
              leverage,
              kind: 'sl',
            });
    }
    onConfirm({ takeProfitPrice: tpPrice, stopLossPrice: slPrice });
    onClose();
  }

  function handleClear() {
    onConfirm({ takeProfitPrice: '', stopLossPrice: '' });
    onClose();
  }

  const unit = mode === 'price' ? '$' : '%';

  return (
    <Dialog2 open={open} onClose={onClose} title="Auto-close" size="content">
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
              onChange={(e) => setTp(clampDecimal(e.currentTarget.value))}
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
              onChange={(e) => setSl(clampDecimal(e.currentTarget.value))}
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
    </Dialog2>
  );
}
