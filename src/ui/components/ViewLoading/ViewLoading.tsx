import React from 'react';
import { ellipsis, NBSP } from 'src/ui/shared/typography';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useRenderDelay } from '../DelayedRender/DelayedRender';
import { FillView } from '../FillView';

interface Props {
  size?: string;
  kind?: 'default' | 'network';
}

export function ViewLoading({ size = '24px', kind = 'default' }: Props) {
  const isTooLong = useRenderDelay(6000);
  return (
    <FillView>
      {!navigator.onLine && kind === 'network' ? (
        <UIText kind="body/regular" color="var(--neutral-600)">
          You are offline
        </UIText>
      ) : (
        <VStack gap={8} style={{ placeItems: 'center' }}>
          <CircleSpinner color="var(--primary)" size={size} />

          {kind === 'network' ? (
            <UIText kind="small/regular" color="var(--neutral-600)">
              {isTooLong
                ? `Request is taking longer than usual${ellipsis}`
                : NBSP}
            </UIText>
          ) : null}
        </VStack>
      )}
    </FillView>
  );
}
