import { useMutation } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { walletPort } from 'src/ui/shared/channels';
import { collectData } from 'src/ui/shared/form-data';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useWalletsMeta } from '../shared/useWalletsMeta';
import { saveReferrer } from '../shared/storage';

async function referWallet({
  address,
  referralCode,
}: {
  address: string;
  referralCode: string;
}) {
  const signature = await walletPort.request('uiSignReferrerMessage', {
    address,
    referralCode,
  });
  return ZerionAPI.referWallet({ address, referralCode, signature });
}

export function InvitationCodeDialog({
  ownedAddresses,
  myReferralCode,
  onSuccess,
  onDismiss,
}: {
  ownedAddresses: string[];
  myReferralCode: string | null;
  onSuccess: () => void;
  onDismiss: () => void;
}) {
  const { data: ownedAddressesMeta, isLoading: isLoadingWalletsMeta } =
    useWalletsMeta({ addresses: ownedAddresses });

  const ownedAddressesWithoutReferrer = useMemo(
    () =>
      (ownedAddressesMeta ?? [])
        .filter((meta) => meta.membership.referrer === null)
        .map((meta) => meta.address),
    [ownedAddressesMeta]
  );

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

        const response = await ZerionAPI.checkReferral({ referralCode });
        const referrer = response.data;

        await saveReferrer(referrer);

        if (referrer.address) {
          await walletPort.request('uiAddReadonlyAddress', {
            address: referrer.address,
            name: referrer.handle,
          });
        }

        await Promise.allSettled(
          ownedAddressesWithoutReferrer.map((address) =>
            referWallet({ address, referralCode: referrer.referralCode })
          )
        );

        onSuccess();
      },
    });

  if (isLoadingWalletsMeta) {
    return null;
  }

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
