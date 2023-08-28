import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { fishingDefencePort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { useRenderDelay } from '../DelayedRender/DelayedRender';

function useFishingDefenceStatus(origin: string) {
  return useQuery({
    queryKey: ['fishingDefence', 'getWebsiteStatus', origin],
    queryFn: () =>
      fishingDefencePort.request('getWebsiteStatus', { url: origin }),
    cacheTime: 0,
    suspense: false,
    refetchInterval: (data) =>
      data === 'loading' || data === 'unknown' ? 100 : false,
  });
}

export function FishingDefenceStatus({ origin }: { origin: string }) {
  const delayedDisplayStatus = useRenderDelay(500);
  const { data: fishingDefenceStatus } = useFishingDefenceStatus(origin);

  if (fishingDefenceStatus === 'ok' || !delayedDisplayStatus) {
    return null;
  }

  if (fishingDefenceStatus === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <HStack
          gap={8}
          alignItems="center"
          style={{
            padding: '10px 12px',
            borderRadius: 20,
            backgroundColor: 'var(--neutral-100)',
          }}
          title="We're verifying this DApp against known malicious lists."
        >
          <CircleSpinner color="var(--neutral-500)" />
          <UIText
            kind="small/accent"
            color="var(--neutral-600)"
            style={{ userSelect: 'none' }}
          >
            Checking DApp..
          </UIText>
          <QuestionHintIcon style={{ color: 'var(--neutral-500)' }} />
        </HStack>
      </div>
    );
  }

  if (fishingDefenceStatus === 'error' || fishingDefenceStatus === 'unknown') {
    return (
      <>
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
            Phishing Defence verification is temporarily Unavailable. Proceed
            with caution.
          </UIText>
        </VStack>
        <Spacer height={16} />
      </>
    );
  }

  if (fishingDefenceStatus === 'fishing') {
    return (
      <>
        <VStack
          gap={8}
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid var(--negative-500)',
          }}
        >
          <HStack gap={8} alignItems="center">
            <ValidationErrorIcon style={{ color: 'var(--negative-500)' }} />
            <UIText kind="body/accent" color="var(--negative-500)">
              Malicious Transaction
            </UIText>
          </HStack>
          <UIText kind="small/regular" color="var(--negative-500)">
            Potential risks:
            <ul style={{ marginBlock: 0, paddingLeft: 16 }}>
              <li>Theft of recovery phrase</li>
              <li>Phishing attacks</li>
              <li>Fake tokens or scams</li>
            </ul>
          </UIText>
        </VStack>
        <Spacer height={16} />
      </>
    );
  }

  return null;
}
