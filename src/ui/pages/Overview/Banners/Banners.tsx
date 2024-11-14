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
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';

function DnaBanners({ address }: { address: string }) {
  const { preferences, setPreferences } = usePreferences();

  const showDnaMintBanner = useShowDnaMintBanner(address);
  const showUpgradeBanner = useAddressHasDnaUpgradeBackgroundPerk(address);

  const mintBannerVisible =
    !preferences?.mintDnaBannerDismissed && showDnaMintBanner;

  const upgradeBannerVisible =
    !preferences?.upgradeDnaBannerDismissed &&
    !showDnaMintBanner &&
    showUpgradeBanner;

  return (
    <>
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
    </>
  );
}

export function Banners({ address }: { address: string }) {
  const { data: loyaltyEnabled, isLoading: isLoadingRemoteConfigValue } =
    useRemoteConfigValue('extension_loyalty_enabled');

  const { preferences, setPreferences } = usePreferences();

  if (isLoadingRemoteConfigValue) {
    return null;
  }

  const invitationBannerVisible =
    FEATURE_LOYALTY_FLOW &&
    loyaltyEnabled &&
    !preferences?.invitationBannerDismissed;

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
      {ENABLE_DNA_BANNERS && !invitationBannerVisible ? (
        <DnaBanners address={address} />
      ) : null}
    </div>
  );
}
