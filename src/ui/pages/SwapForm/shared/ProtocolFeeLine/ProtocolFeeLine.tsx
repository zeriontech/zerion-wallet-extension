import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import type { Quote } from 'src/shared/types/Quote';

const ZERION_FEES_ARTICLE =
  'https://zerion.io/blog/preparing-for-a-decentralized-future-at-zerion/';

export function ProtocolFeeLine({ quote }: { quote: Quote }) {
  return (
    <UIText kind="caption/regular" color="var(--neutral-600)">
      <HStack gap={4} alignItems="center">
        {quote.protocol_fee > 0
          ? `Quote includes ${formatPercent(
              quote.protocol_fee,
              'en'
            )}% Zerion fee`
          : `No Zerion fees`}
        <UnstyledAnchor
          title="Applies to all Multichain transactions. Zerion Premium DNA holders get discounts. Click to learn more."
          href={ZERION_FEES_ARTICLE}
          rel="noopener noreferrer"
          target="_blank"
        >
          <InfoIcon
            role="decoration"
            style={{
              width: 16,
              height: 16,
              display: 'block',
              color: 'var(--neutral-600)',
            }}
          />
        </UnstyledAnchor>
      </HStack>
    </UIText>
  );
}
