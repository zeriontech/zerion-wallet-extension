import React from 'react';
import { QRCode } from 'react-qrcode-logo';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UnorderedListItem } from '../shared/UnorderedListItem';
import { Circle } from '../shared/Circle';
import * as styles from './styles.module.css';

export function QRCodeDialog({ myReferralLink }: { myReferralLink: string }) {
  return (
    <VStack gap={24}>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">Your QR Code</UIText>}
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
      <div className={styles.qrCode}>
        <QRCode quietZone={0} size={245} value={myReferralLink} />
      </div>
    </VStack>
  );
}
