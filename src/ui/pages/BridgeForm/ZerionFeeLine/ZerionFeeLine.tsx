import React from 'react';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import type { Quote } from 'src/shared/types/Quote';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import QuestionIcon from 'jsx:src/ui/assets/question-hint.svg';

export function ZerionFeeLine({ quote }: { quote: Quote | null }) {
  const baseProtocolFee = quote?.base_protocol_fee;
  const protocolFeePercent = quote?.protocol_fee;
  const baseFee =
    baseProtocolFee && baseProtocolFee !== protocolFeePercent
      ? `${formatPercent(baseProtocolFee, 'en')}%`
      : '';
  const actualFee =
    protocolFeePercent !== undefined
      ? `${formatPercent(protocolFeePercent, 'en')}%`
      : '';

  const { data: config, isLoading: isConfigLoading } = useFirebaseConfig([
    'zerion_fee_learn_more_link',
  ]);

  return (
    <HStack gap={12} justifyContent="space-between" alignItems="center">
      <HStack gap={4} alignItems="center">
        <UIText kind="small/regular" color="var(--neutral-700)">
          Zerion Fee
        </UIText>
        {isConfigLoading ? null : (
          <UnstyledAnchor
            title="Applies to all Multichain transactions. Zerion Premium DNA holders get discounts. Click to learn more."
            href={config?.zerion_fee_learn_more_link}
            rel="noopener noreferrer"
            target="_blank"
          >
            <QuestionIcon
              role="decoration"
              style={{
                width: 20,
                height: 20,
                display: 'block',
                color: 'var(--neutral-600)',
              }}
            />
          </UnstyledAnchor>
        )}
      </HStack>
      {!quote ? null : protocolFeePercent ? (
        <UIText kind="small/accent">
          <UIText
            kind="small/regular"
            color="var(--neutral-600)"
            inline={true}
            style={{ textDecoration: 'line-through' }}
          >
            {baseFee}
          </UIText>{' '}
          {actualFee}
        </UIText>
      ) : (
        <UIText
          kind="small/accent"
          style={{
            background:
              'linear-gradient(113deg, #20DBE7 6.71%, #4B7AEF 58.69%, #BC29EF 102.67%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Free
        </UIText>
      )}
    </HStack>
  );
}
