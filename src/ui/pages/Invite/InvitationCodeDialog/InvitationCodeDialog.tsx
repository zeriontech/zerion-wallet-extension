import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { walletPort } from 'src/ui/shared/channels';
import { collectData } from 'src/ui/shared/form-data';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function InvitationCodeDialog({
  myReferralCode,
  onSuccess,
  onDismiss,
}: {
  myReferralCode: string;
  onSuccess: () => void;
  onDismiss: () => void;
}) {
  const { mutate: applyReferralCode } = useMutation({
    mutationFn: async ({
      referralCode: rawReferralCode,
    }: {
      referralCode: string;
    }) => {
      const referralCode = rawReferralCode.trim();
      if (myReferralCode === referralCode) {
        throw new Error('Can not apply your own referral code');
      }

      const response = await ZerionAPI.checkReferral({ referralCode });
      const referrer = response.data;

      if (referrer.address) {
        await walletPort.request('uiAddReadonlyAddress', {
          address: referrer.address,
          name: referrer.handle,
        });
      }

      // refer all accounts
      //   |- await ZerionAPI.referWallet({  });

      onSuccess();
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
          />
          <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Button
              kind="regular"
              type="button"
              onClick={(event) => {
                event?.currentTarget?.form?.reset();
                onDismiss();
              }}
            >
              Back
            </Button>
            <Button kind="primary">Apply</Button>
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}
