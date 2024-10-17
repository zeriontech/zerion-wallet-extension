import React from 'react';
import { usePreferences } from 'src/ui/features/preferences';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import {
  useShowDnaMintBanner,
  useAddressHasDnaUpgradeBackgroundPerk,
} from '../shared/useShowDnaBanner';
import { MintBanner } from './MintBanner';
import { UpgradeBanner } from './UpgradeBanner';

// The DNA contract will stop working by the end of October 2024,
// that's why we want to disable the minting flow for now
// We may reenable it later with some changes
export const ENABLE_DNA_BANNERS = false;

export function OverviewDnaBanners({ address }: { address: string }) {
  const { preferences, setPreferences } = usePreferences();
  const showDnaMintBanner = useShowDnaMintBanner(address);
  const showUpgradeBanner = useAddressHasDnaUpgradeBackgroundPerk(address);

  return (
    <>
      {!preferences?.mintDnaBannerDismissed && showDnaMintBanner ? (
        <>
          <MintBanner
            address={address}
            onDismiss={() => setPreferences({ mintDnaBannerDismissed: true })}
          />
          <Spacer height={24} />
        </>
      ) : null}
      {!preferences?.upgradeDnaBannerDismissed &&
      !showDnaMintBanner &&
      showUpgradeBanner ? (
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

export function NftTabDnaBanner({
  address,
  style,
}: {
  address: string;
  style: React.CSSProperties;
}) {
  const { preferences } = usePreferences();
  const showDnaMintBanner = useShowDnaMintBanner(address);

  return preferences?.mintDnaBannerDismissed && showDnaMintBanner ? (
    <div style={style}>
      <MintBanner address={address} />
    </div>
  ) : null;
}

export function SettingsDnaBanners({ address }: { address: string }) {
  const showDnaMintBanner = useShowDnaMintBanner(address);
  const showUpgradeBanner = useAddressHasDnaUpgradeBackgroundPerk(address);

  return showDnaMintBanner ? (
    <MintBanner address={address} />
  ) : showUpgradeBanner ? (
    <UpgradeBanner address={address} />
  ) : null;
}
