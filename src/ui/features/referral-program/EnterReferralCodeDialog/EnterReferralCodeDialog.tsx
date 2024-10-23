import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { collectData } from 'src/ui/shared/form-data';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';

export function EnterReferralCodeDialog({
  myReferralCode,
  onSuccess,
  onDismiss,
}: {
  myReferralCode: string | null;
  onSuccess: (pendingReferrer: ReferrerData) => void;
  onDismiss: () => void;
}) {
  const { mutate: applyReferralCode, ...applyReferralCodeMutation } =
    useMutation({
      mutationFn: async ({
        referralCode: rawReferralCode,
      }: {
        referralCode: string;
      }) => {
        const referralCode = rawReferralCode.trim();
        if (myReferralCode === referralCode) {
          throw new Error('Can not apply your own referral code');
        }
        const referrer = await walletPort.request(
          'uiApplyReferralCodeToAllWallets',
          {
            referralCode,
          }
        );
        onSuccess(referrer);
      },
    });

  return (
    <VStack gap={24}>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">Your Invitation Code</UIText>}
        closeKind="icon"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();

          const form = event.currentTarget;
          if (!form.checkValidity()) {
            return;
          }
          const formData = collectData(form, {});
          const referralCode = formData.referralCode as string;

          applyReferralCode({ referralCode });
        }}
      >
        <VStack gap={32}>
          <Input
            autoFocus={true}
            name="referralCode"
            placeholder="Enter Code"
            required={true}
            disabled={applyReferralCodeMutation.isLoading}
          />
          <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Button
              kind="regular"
              type="button"
              disabled={applyReferralCodeMutation.isLoading}
              onClick={(event) => {
                event?.currentTarget?.form?.reset();
                onDismiss();
              }}
            >
              Back
            </Button>
            <Button
              kind="primary"
              disabled={applyReferralCodeMutation.isLoading}
            >
              {applyReferralCodeMutation.isLoading ? 'Applying...' : 'Apply'}
            </Button>
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}