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
import { FEATURE_LOYALTY_FLOW, FEATURE_SOLANA } from 'src/env/config';
import { OverviewPremiumBanner } from 'src/ui/features/premium/banners/OverviewBanner';
import { usePremiumStatus } from 'src/ui/features/premium/getPremiumStatus';
import { SolanaBanner } from './SolanaBanner';

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
  const { data: loyaltyEnabled, isLoading: isRemoteConfigLoading } =
    useRemoteConfigValue('extension_loyalty_enabled');

  const { preferences, setPreferences } = usePreferences();

  const invitationBannerVisible =
    FEATURE_LOYALTY_FLOW === 'on' &&
    loyaltyEnabled &&
    !preferences?.invitationBannerDismissed;

  const solanaBannerVisible =
    FEATURE_SOLANA === 'on' && !preferences?.solanaBannerDismissed;

  const { isPremium, walletsMetaQuery } = usePremiumStatus({ address });

  const premiumBannerVisible =
    !isPremium && !preferences?.premiumBannerDismissed;

  if (isRemoteConfigLoading || walletsMetaQuery.isLoading) {
    return null;
  }

  return (
    <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
      {premiumBannerVisible ? (
        <>
          <OverviewPremiumBanner
            onDismiss={() => setPreferences({ premiumBannerDismissed: true })}
          />
          <Spacer height={24} />
        </>
      ) : solanaBannerVisible ? (
        <>
          <SolanaBanner
            onDismiss={() => setPreferences({ solanaBannerDismissed: true })}
          />
          <Spacer height={24} />
        </>
      ) : invitationBannerVisible ? (
        <>
          <InviteFriendsBanner
            onDismiss={() =>
              setPreferences({ invitationBannerDismissed: true })
            }
          />
          <Spacer height={24} />
        </>
      ) : ENABLE_DNA_BANNERS ? (
        <DnaBanners address={address} />
      ) : null}
    </div>
  );
}
