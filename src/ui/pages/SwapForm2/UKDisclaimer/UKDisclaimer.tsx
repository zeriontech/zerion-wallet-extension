import React from 'react';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
// import { useUKDetection } from 'src/ui/components/UKDisclaimer/useUKDetection';

export function UKDisclaimer() {
  // const { isUK } = useUKDetection();

  // if (!isUK) {
  //   return null;
  // }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 24,
        backgroundColor: 'var(--neutral-100)',
      }}
    >
      <VStack gap={8}>
        <UIText kind="small/accent">Disclaimer for UK Residents</UIText>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          Remember, investing in crypto carries a high risk, and you should only
          invest what you can afford to lose. There is no safety if things go
          wrong.{' '}
          <TextAnchor
            style={{ color: 'var(--primary)' }}
            href="https://ramp.network/risk-warning"
            rel="noopener noreferrer"
            target="_blank"
          >
            Learn more
          </TextAnchor>
        </UIText>
      </VStack>
    </div>
  );
}
