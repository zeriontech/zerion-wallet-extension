import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import type { Quote } from 'src/shared/types/Quote';

const ZERION_FEES_ARTICLE =
  'https://zerion.io/blog/preparing-for-a-decentralized-future-at-zerion/';

export function ProtocolFeeLine({ quote }: { quote: Quote }) {
  return (
    <HStack gap={8} justifyContent="space-between">
      <UIText kind="small/regular" color="var(--neutral-700)">
        <HStack gap={4} alignItems="center">
          Zerion Fee
          <UnstyledAnchor
            title="Applies to all Multichain transactions. Zerion Premium DNA holders get discounts. Click to learn more."
            href={ZERION_FEES_ARTICLE}
            rel="noopener noreferrer"
            target="_blank"
          >
            <QuestionHintIcon
              role="decoration"
              style={{ display: 'block', color: 'var(--neutral-500)' }}
            />
          </UnstyledAnchor>
        </HStack>
      </UIText>
      <UIText kind="small/regular">
        {`${formatPercent(quote.protocol_fee, 'en')}%`}
      </UIText>
    </HStack>
  );
}
