import React from 'react';
import ArrowIcon from 'jsx:src/ui/assets/arrow-right.svg';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';

interface Props {
  approved: boolean;
  actionName: string;
}

const mainColor = 'var(--black)';
const secondaryColor = 'var(--neutral-500)';

const EXPLAIN_APPROVE_URL =
  'https://help.zerion.io/en/articles/4228406-what-does-approve-mean-when-making-a-transaction';

export function ApproveHintLine({ approved, actionName }: Props) {
  return (
    <HStack alignItems="center" gap={4}>
      <HStack alignItems="center" gap={4}>
        <UIText
          kind="small/accent"
          color={approved ? secondaryColor : mainColor}
          style={{ transition: 'color 300ms' }}
        >
          1. Approve
        </UIText>
        <UnstyledAnchor
          title="Allow Zerion to spend the asset"
          href={EXPLAIN_APPROVE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <QuestionHintIcon
            style={{ display: 'block', color: 'var(--neutral-500)' }}
          />
        </UnstyledAnchor>
      </HStack>
      <ArrowIcon
        style={{
          width: 20,
          height: 20,
          color: approved ? mainColor : secondaryColor,
          transition: 'color 300ms',
        }}
      />
      <UIText
        kind="small/accent"
        color={approved ? mainColor : secondaryColor}
        style={{ transition: 'color 300ms' }}
      >
        2. {actionName}
      </UIText>
    </HStack>
  );
}
