import React, { useEffect, useId, useRef } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import BigNumber from 'bignumber.js';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import { isMacOS } from 'src/ui/shared/isMacos';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import {
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { FormFieldset } from './FormFieldset';
import type { HandleChangeFunction, SendFormState2 } from './types';
import { NftSelectorButton } from './NftSelectorButton';
import * as assetSelectorStyles from './AssetSelectorButton.module.css';

function isErc721(nftPosition: NftPosition | null): boolean {
  return nftPosition?.nft.interface === 'ERC721';
}

function partialIntBalance(balance: string, factor: number): string {
  if (factor === 1) return new BigNumber(balance).toFixed(0);
  return new BigNumber(balance)
    .multipliedBy(factor)
    .decimalPlaces(0, BigNumber.ROUND_DOWN)
    .toFixed();
}

export function InputNftPosition({
  formState,
  onChange,
  nftPosition,
  onOpenSelector,
}: {
  formState: SendFormState2;
  onChange: HandleChangeFunction;
  nftPosition: NftPosition | null;
  onOpenSelector: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const erc721 = isErc721(nftPosition);
  const balanceQuantity = nftPosition?.amount.quantity ?? null;
  const showAmountInput =
    !erc721 &&
    balanceQuantity != null &&
    new BigNumber(balanceQuantity).isGreaterThan(1);

  // When amount input is hidden, keep form state at '1'.
  useEffect(() => {
    if (!showAmountInput && formState.nftAmount !== '1') {
      onChange('nftAmount', '1');
    }
  }, [showAmountInput, formState.nftAmount, onChange]);

  const exceedsBalance =
    showAmountInput &&
    balanceQuantity != null &&
    new BigNumber(formState.nftAmount || '0').isGreaterThan(balanceQuantity);

  const shakeControls = useAnimationControls();
  const prevExceedsRef = useRef(exceedsBalance);
  useEffect(() => {
    if (!prevExceedsRef.current && exceedsBalance) {
      shakeControls.start({
        x: [0, -4, 4, -3, 3, -2, 2, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
    }
    prevExceedsRef.current = exceedsBalance;
  }, [exceedsBalance, shakeControls]);

  const handleQuickAmount = (factor: number) => {
    if (!balanceQuantity) return;
    onChange('nftAmount', partialIntBalance(balanceQuantity, factor));
    inputRef.current?.focus();
  };

  const showQuickAmounts = showAmountInput;

  return (
    <FormFieldset
      inputId={inputId}
      startTitle={<UIText kind="small/regular">NFT</UIText>}
      endTitle={
        showQuickAmounts ? (
          <HStack gap={16} alignItems="center">
            {QUICK_AMOUNTS.map(({ factor, title }) => (
              <QuickAmountButton
                key={factor}
                onClick={() => handleQuickAmount(factor)}
              >
                {title}
              </QuickAmountButton>
            ))}
          </HStack>
        ) : (
          <div />
        )
      }
      startContent={
        <TooltipProvider placement="top" timeout={1000}>
          <TooltipAnchor
            render={
              <NftSelectorButton
                position={nftPosition}
                onClick={onOpenSelector}
              />
            }
          />
          <Tooltip
            className={assetSelectorStyles.tooltip}
            gutter={8}
            portal={false}
          >
            <UIText kind="caption/regular">
              <span>Select NFT to Send</span>{' '}
              <span className={assetSelectorStyles.tooltipKbd}>
                {isMacOS() ? '⇧↑' : 'Shift+↑'}
              </span>
            </UIText>
          </Tooltip>
        </TooltipProvider>
      }
      endContent={
        showAmountInput ? (
          <DebouncedInput
            delay={200}
            value={formState.nftAmount ?? ''}
            onChange={(value) => onChange('nftAmount', value)}
            render={({ value, handleChange }) => (
              <UnstyledInput
                autoFocus={true}
                id={inputId}
                ref={inputRef}
                style={{
                  textAlign: 'end',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
                inputMode="numeric"
                name="nftAmount"
                value={value}
                placeholder="0"
                onChange={(event) => {
                  const next = event.currentTarget.value.replace(/\s/g, '');
                  if (!/^\d*$/.test(next)) return;
                  handleChange(next);
                }}
                pattern="\d+"
                required={true}
              />
            )}
          />
        ) : (
          <UIText kind="headline/h3" style={{ textAlign: 'end' }}>
            1
          </UIText>
        )
      }
      startDescription={
        showAmountInput && balanceQuantity != null ? (
          <motion.div
            animate={shakeControls}
            style={{
              color: exceedsBalance
                ? 'var(--negative-500)'
                : 'var(--neutral-600)',
              display: 'flex',
              gap: 4,
            }}
          >
            <span>Balance:</span>
            <BlurrableBalance
              kind="small/regular"
              color={
                exceedsBalance ? 'var(--negative-500)' : 'var(--neutral-600)'
              }
            >
              {formatTokenValue(balanceQuantity)}
            </BlurrableBalance>
          </motion.div>
        ) : (
          <span />
        )
      }
      endDescription={null}
    />
  );
}
