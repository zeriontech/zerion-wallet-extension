import React from 'react';
import { MintBanner } from 'src/ui/DNA/components/MintBanner';
import { UpgradeBanner } from 'src/ui/DNA/components/UpgradeBanner';
import {
  useAddressHasDnaUpgradeBackgroundPerk,
  useShowDnaMintBanner,
} from 'src/ui/DNA/shared/useShowDnaBanner';
import { usePreferences } from 'src/ui/features/preferences';
import { InviteFriendsBanner } from 'src/ui/features/referral-program/components/InviteFriendsBanner';
import { Spacer } from 'src/ui/ui-kit/Spacer';

export function Banners({ address }: { address: string }) {
  const { preferences, setPreferences } = usePreferences();

  const showDnaMintBanner = useShowDnaMintBanner(address);
  const showUpgradeBanner = useAddressHasDnaUpgradeBackgroundPerk(address);

  const invitationBannerVisible = !preferences?.invitationBannerDismissed;

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
      {mintBannerVisible ? (
        <>
          <MintBanner
            address={address}
            onDismiss={() => setPreferences({ mintDnaBannerDismissed: true })}
          />
          <Spacer height={24} />
        </>
      ) : null}
      {upgradeBannerVisible ? (
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
