import React from 'react';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CopyButton } from 'src/ui/components/CopyButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnorderedListItem } from '../shared/UnorderedListItem';
import { Circle } from '../shared/Circle';
import * as styles from './styles.module.css';

function ReferralLink({ value }: { value: string }) {
  return (
    <HStack
      className={styles.referralLinkContainer}
      gap={16}
      alignItems="center"
      style={{ gridAutoColumns: '1fr auto' }}
    >
      <UIText kind="headline/h3" className={styles.referralLink} title={value}>
        {value}
      </UIText>
      <CopyButton
        title="Copy Invite Link"
        textToCopy={value}
        size={24}
        btnStyle={{
          padding: 0,
          display: 'block',
          ['--button-text' as string]:
            'var(--copy-button-text-color, var(--neutral-500))',
        }}
      />
    </HStack>
  );
}

export function ReferralLinkDialog({ referralLink }: { referralLink: string }) {
  return (
    <VStack gap={24}>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">Your Invite Link</UIText>}
        closeKind="icon"
      />
      <VStack gap={12}>
        <UnorderedListItem
          marker={<Circle>1</Circle>}
          text="After invitee completes setup wallet, they get a Premium Trial."
        />
        <UnorderedListItem
          marker={<Circle>2</Circle>}
          text="You start receiving a 10% of the XP they earn in the Loyalty Program."
        />
      </VStack>
      <ReferralLink value={referralLink} />
    </VStack>
  );
}
