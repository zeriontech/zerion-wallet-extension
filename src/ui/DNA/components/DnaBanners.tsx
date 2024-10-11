import React from 'react';
import { usePreferences } from 'src/ui/features/preferences';
import {
  useShowDnaMintBanner,
  useAddressHasDnaUpgradeBackgroundPerk,
} from '../shared/useShowDnaBanner';
import { MintBanner } from './MintBanner';
import { UpgradeBanner } from './UpgradeBanner';

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
