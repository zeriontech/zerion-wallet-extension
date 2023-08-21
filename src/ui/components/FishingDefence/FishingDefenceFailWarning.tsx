import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { fishingDefencePort } from 'src/ui/shared/channels';
import { useRenderDelay } from '../DelayedRender/DelayedRender';

export function useFishingDefenceServiceFail(origin: string) {
  const delayFlag = useRenderDelay(200);

  const { data } = useQuery({
    queryKey: ['fishingService', 'getWebsiteStatus', origin],
    queryFn: () =>
      fishingDefencePort.request('getWebsiteStatus', { url: origin }),
    cacheTime: 0,
    enabled: delayFlag,
    refetchInterval: 1000,
  });

  return data === 'loading' || data === 'unknown';
}

export function FishingDefenceServiceFailWarning() {
  return (
    <VStack
      gap={8}
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid var(--notice-500)',
      }}
    >
      <HStack gap={8} alignItems="center">
        <ValidationErrorIcon style={{ color: 'var(--notice-600)' }} />
        <UIText kind="body/accent" color="var(--notice-600)">
          Safety Check Unavailable
        </UIText>
      </HStack>
      <UIText kind="small/regular" color="var(--notice-600)">
        Phishing Defence verification is temporarily Unavailable. Proceed with
        caution.
      </UIText>
    </VStack>
  );
}
