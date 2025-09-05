import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WarningIcon } from '../WarningIcon';

export function UKDisclaimer({ style }: { style?: React.CSSProperties }) {
  return (
    <HStack
      gap={12}
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'var(--neutral-100)',
        ...style,
      }}
    >
      <WarningIcon
        kind="neutral"
        size={32}
        glow={true}
        outlineStrokeWidth={5}
      />
      <VStack gap={4}>
        <UIText kind="small/accent">Disclaimer for UK Residents</UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          Remember, investing in crypto carries a high risk, and you should only
          invest what you can afford to lose. There is no safety if things go
          wrong.
          <br />
          <TextAnchor
            style={{ color: 'var(--neutral-500)' }}
            href="https://ramp.network/risk-warning"
            rel="noopener noreferrer"
            target="_blank"
          >
            Learn more
          </TextAnchor>
        </UIText>
      </VStack>
    </HStack>
  );
}
