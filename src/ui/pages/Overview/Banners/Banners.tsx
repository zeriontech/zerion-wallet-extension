import React from 'react';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { MintBanner } from 'src/ui/DNA/components/MintBanner';
import { UpgradeBanner } from 'src/ui/DNA/components/UpgradeBanner';
import {
  useAddressHasDnaUpgradeBackgroundPerk,
  useShowDnaMintBanner,
} from 'src/ui/DNA/shared/useShowDnaBanner';
import { usePreferences } from 'src/ui/features/preferences';
import { InviteFriendsBanner } from 'src/ui/features/referral-program/InviteFriendsBanner';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ENABLE_DNA_BANNERS } from 'src/ui/DNA/components/DnaBanners';

export function Banners({ address }: { address: string }) {
  const {
    data: referralProgramEnabled,
    isLoading: isLoadingRemoteConfigValue,
  } = useRemoteConfigValue('extension_referral_program');

  const { preferences, setPreferences } = usePreferences();

  const showDnaMintBanner = useShowDnaMintBanner(address);
  const showUpgradeBanner = useAddressHasDnaUpgradeBackgroundPerk(address);

  if (isLoadingRemoteConfigValue) {
    return null;
  }

  const invitationBannerVisible =
    referralProgramEnabled && !preferences?.invitationBannerDismissed;

  const mintBannerVisible =
    !invitationBannerVisible &&
    !preferences?.mintDnaBannerDismissed &&
    showDnaMintBanner;
  const upgradeBannerVisible =
    !preferences?.upgradeDnaBannerDismissed &&
    !showDnaMintBanner &&
    showUpgradeBanner;

  return (
    <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
      {invitationBannerVisible ? (
        <>
          <InviteFriendsBanner
            onDismiss={() =>
              setPreferences({ invitationBannerDismissed: true })
            }
          />
          <Spacer height={24} />
        </>
      ) : null}
      {mintBannerVisible && ENABLE_DNA_BANNERS ? (
        <>
          <MintBanner
            address={address}
            onDismiss={() => setPreferences({ mintDnaBannerDismissed: true })}
          />
          <Spacer height={24} />
        </>
      ) : null}
      {upgradeBannerVisible && ENABLE_DNA_BANNERS ? (
        <>
          <UpgradeBanner
            address={address}
            onDismiss={() =>
              setPreferences({ upgradeDnaBannerDismissed: true })
            }
          />
          <Spacer height={24} />
        </>
      ) : null}
    </div>
  );
}
