import React, { useId } from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Networks } from 'src/modules/networks/Networks';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import type { HandleChangeFunction } from './types';
import { FormFieldset } from './FormFieldset';
import { AssetSelectorButton } from './AssetSelectorButton';
import { ReceivePositionSelector } from './PositionSelector/ReceivePositionSelector';

export function OutputPosition({
  onChange,
  position,
  outputAmount,
  outputChain,
  positions,
  networks,
}: {
  onChange: HandleChangeFunction;
  position: FungiblePosition | null;
  outputAmount: string | null;
  outputChain: string | undefined;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const { currency } = useCurrency();
  const inputId = useId();
  const selectorDialog = useDialog2();
  const positionBalance = position?.amount.quantity ?? null;

  const inputValue = new BigNumber(outputAmount || '0').times(
    position?.fungible.meta.price || 0
  );

  return (
    <>
      <FormFieldset
        inputId={inputId}
        startTitle={<UIText kind="small/regular">Receive</UIText>}
        endTitle={<div />}
        startContent={
          <AssetSelectorButton
            position={position}
            onClick={selectorDialog.openDialog}
          />
        }
        endContent={
          <div
            style={{
              color: outputAmount != null ? undefined : 'var(--neutral-400)',
            }}
          >
            {outputAmount != null ? outputAmount : '0'}
          </div>
        }
        startDescription={
          <HStack gap={4} alignItems="center">
            <span>Balance:</span>
            <BlurrableBalance kind="small/regular">
              {positionBalance ? formatTokenValue(positionBalance) : null}
            </BlurrableBalance>
          </HStack>
        }
        endDescription={
          <UIText kind="small/regular">
            {formatCurrencyValue(inputValue, 'en', currency)}
          </UIText>
        }
      />
      <ReceivePositionSelector
        open={selectorDialog.open}
        onClose={selectorDialog.closeDialog}
        positions={positions}
        networks={networks}
        currentChain={outputChain}
        onSelect={(fungible, chainId) => {
          onChange('outputChain', chainId);
          onChange('outputFungibleId', fungible.id);
        }}
      />
    </>
  );
}
