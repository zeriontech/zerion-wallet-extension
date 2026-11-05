import React from 'react';
import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import {
  getNetworkFeeLevelColor,
  NETWORK_SPEED_TO_TITLE,
  shouldShowNetworkFeeLevelLabel,
} from 'src/ui/pages/SendTransaction/NetworkFee/constants';
import { NetworkFeeIcon } from 'src/ui/pages/SendTransaction/NetworkFee/NetworkFeeIcon';

export function NetworkFeeLevelLabel({
  speed,
  separatorColor = 'var(--black)',
}: {
  speed: NetworkFeeSpeed;
  separatorColor?: string;
}) {
  if (!shouldShowNetworkFeeLevelLabel(speed)) {
    return null;
  }
  const color = getNetworkFeeLevelColor(speed);
  return (
    <HStack gap={4} alignItems="center" style={{ color, whiteSpace: 'nowrap' }}>
      <NetworkFeeIcon speed={speed} style={{ width: 16, height: 16 }} />
      <UIText kind="small/accent">{NETWORK_SPEED_TO_TITLE[speed]}</UIText>
      <UIText kind="small/accent" color={separatorColor}>
        &middot;
      </UIText>
    </HStack>
  );
}
