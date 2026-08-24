import React from 'react';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import { WalletSelectButton } from 'src/ui/components/WalletSelectButton';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { DepositFormState } from './types';
import * as styles from './styles.module.css';

/**
 * The token that lands in the wallet is picked per ecosystem, so it cannot
 * survive a switch to an address of another kind — ETH-on-Ethereum is not
 * receivable by a Solana address. The amount, currency and country are facts
 * about the buyer rather than the wallet, so those stay.
 */
const CLEARED_ON_WALLET_CHANGE: (keyof DepositFormState & string)[] = [
  'outputFungibleId',
  'outputChain',
];

/**
 * The pair of controls in the top-right corner of both deposit steps: provider
 * settings beside the wallet the money lands in, laid out like SwapForm2's.
 */
export function DepositHeaderControls({
  address,
  onSettings,
  settingsDisabled = false,
}: {
  address: string | null;
  /** Omitted on the token step, which has nothing to configure yet. */
  onSettings?: () => void;
  /** Holds the button's place while the data its dialog needs is in flight. */
  settingsDisabled?: boolean;
}) {
  return (
    <div className={styles.absoluteHeader}>
      {/* The row keeps the settings button's 36px height even on the step that
          has no settings button, so the 24px avatar stays vertically centred
          against it instead of riding 6px higher than on the form. */}
      <HStack gap={4} alignItems="center" style={{ minHeight: 36 }}>
        {onSettings || settingsDisabled ? (
          <Button
            type="button"
            kind="ghost"
            size={36}
            style={{ padding: 6 }}
            title="Change provider"
            aria-label="Change provider"
            disabled={settingsDisabled}
            onClick={onSettings}
          >
            <SettingsIcon style={{ display: 'block' }} />
          </Button>
        ) : null}
        {address ? (
          <WalletSelectButton
            address={address}
            clearSearchParams={CLEARED_ON_WALLET_CHANGE}
          />
        ) : null}
      </HStack>
    </div>
  );
}
