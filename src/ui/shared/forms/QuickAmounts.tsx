import type { Asset } from 'defi-sdk';
import React from 'react';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';

export function getQuickAmounts(
  asset: Asset,
  networkConfig: NetworkConfig
): { title: string; factor: number }[] {
  if (Networks.isNativeAsset(asset, networkConfig)) {
    return [
      { title: '25%', factor: 0.25 },
      { title: '50%', factor: 0.5 },
      { title: '75%', factor: 0.75 },
    ];
  }
  return [
    { title: '25%', factor: 0.25 },
    { title: '50%', factor: 0.5 },
    { title: 'MAX', factor: 1 },
  ];
}

export function QuickAmountButton({
  children,
  onClick,
}: React.PropsWithChildren<{
  onClick(): void;
}>) {
  return (
    <UnstyledButton type="button" onClick={onClick}>
      <UIText kind="small/regular" color="var(--primary)">
        {children}
      </UIText>
    </UnstyledButton>
  );
}
