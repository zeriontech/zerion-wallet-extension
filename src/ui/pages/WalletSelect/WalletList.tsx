import React, { useId, useRef } from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { SurfaceList, type Item } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import RewardsIcon from 'jsx:src/ui/assets/rewards.svg';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletNameType } from 'src/ui/shared/useProfileName';
import { CopyButton } from 'src/ui/components/CopyButton';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallet-get-meta';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { Button } from 'src/ui/ui-kit/Button';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

const ZERION_ORIGIN = 'https://app.zerion.io';

function WalletListItem({
  wallet,
  groupId,
  showAddressValues,
  exploreRewardsUrl,
  useCssAnchors,
  isSelected,
  ...buttonProps
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  wallet: ExternallyOwnedAccount;
  groupId: string;
  showAddressValues: boolean;
  exploreRewardsUrl: string | null;
  useCssAnchors: boolean;
  isSelected: boolean;
}) {
  const id = useId();
  const { currency } = useCurrency();
  // colons are invalid for anchor-name CSS property
  const anchorName = `--button-slot-${id.replaceAll(':', '')}`;
  const COPY_BUTTON_SIZE = 20;
  const copyButtonRef = useRef<HTMLButtonElement | null>(null);
  const copyButton = (
    <CopyButton
      address={wallet.address}
      onClick={(event) => {
        if (!useCssAnchors) {
          event.stopPropagation();
        }
      }}
      buttonRef={copyButtonRef}
      size={16}
      btnStyle={{
        padding: 0,
        display: 'block',
        ['--button-text' as string]:
          'var(--copy-button-text-color, var(--neutral-500))',
      }}
      tooltipPosition="center-bottom"
      style={{
        verticalAlign: 'middle',
        ...(useCssAnchors
          ? {
              position: 'absolute',
              ['positionAnchor' as string]: anchorName,
              ['insetArea' as string]: 'center',
            }
          : undefined),
      }}
    />
  );
  return (
    <>
      <UnstyledButton
        className={styles.wallet}
        style={{
          borderRadius: 20,
          width: '100%',
          marginBlock: 4,
        }}
        {...buttonProps}
      >
        <VStack gap={0}>
          <HStack
            gap={4}
            justifyContent="space-between"
            alignItems="center"
            style={{ padding: 12 }}
          >
            <Media
              vGap={0}
              image={
                <IsConnectedToActiveTab
                  address={wallet.address}
                  render={({ data: isConnected }) => (
                    <WalletAvatar
                      address={wallet.address}
                      size={40}
                      active={Boolean(isConnected)}
                      borderRadius={4}
                      icon={
                        <WalletSourceIcon
                          address={wallet.address}
                          groupId={groupId}
                          style={{ width: 16, height: 16 }}
                        />
                      }
                    />
                  )}
                />
              }
              text={
                <UIText kind="small/regular">
                  <WalletDisplayName
                    wallet={wallet}
                    render={(data) => (
                      <>
                        <span
                          style={{
                            wordBreak: 'break-all',
                            verticalAlign: 'middle',
                          }}
                        >
                          {data.value}
                        </span>
                        {showAddressValues &&
                        data.type !== WalletNameType.address ? (
                          <>
                            <span
                              className={styles.addressHint}
                              style={{
                                color: 'var(--neutral-500)',
                                verticalAlign: 'middle',
                              }}
                              onClick={(event) => {
                                /**
                                 * This is only a helper to invoke click of the CopyButton
                                 * when the address value is clicked. Therefore it's okay to
                                 * put onClick on the span here as screenreader and keyboard users
                                 * will be able to interact with the actual copy button.
                                 * The reason not to put text inside the CopyButton is that when using
                                 * CSS Anchors we cannot make the anchored element wrap to the new line
                                 * when there's not enough space for it in the slot.
                                 */
                                if (copyButtonRef.current) {
                                  event.stopPropagation();
                                  copyButtonRef.current.click();
                                }
                              }}
                            >
                              {` · ${truncateAddress(wallet.address, 5)}`}
                            </span>
                          </>
                        ) : null}{' '}
                        {useCssAnchors ? (
                          <span
                            // This is a "slot" where copyButton will visually appear
                            style={{
                              display: 'inline-block',
                              width: COPY_BUTTON_SIZE,
                              height: COPY_BUTTON_SIZE,
                              ['anchorName' as string]: anchorName,
                              verticalAlign: 'bottom',
                            }}
                          ></span>
                        ) : (
                          copyButton
                        )}
                      </>
                    )}
                  />
                </UIText>
              }
              detailText={
                <PortfolioValue
                  address={wallet.address}
                  render={(query) => (
                    <UIText kind="headline/h3">
                      {query.data ? (
                        <NeutralDecimals
                          parts={formatCurrencyToParts(
                            query.data.data?.totalValue || 0,
                            'en',
                            currency
                          )}
                        />
                      ) : (
                        NBSP
                      )}
                    </UIText>
                  )}
                />
              }
            />
            {isSelected ? (
              <CheckIcon style={{ width: 24, height: 24 }} />
            ) : null}
          </HStack>
          {exploreRewardsUrl ? (
            <Button
              kind="neutral"
              as={UnstyledAnchor}
              href={exploreRewardsUrl}
              target="_blank"
              size={36}
              style={{
                borderRadius: '0 0 18px 18px',
              }}
            >
              <HStack gap={8} alignItems="center" justifyContent="center">
                <RewardsIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'linear-gradient(90deg, #A024EF 0%, #FDBB6C 100%)',
                  }}
                />
                <UIText kind="small/accent" color="var(--primary-500)">
                  Explore Rewards
                </UIText>
              </HStack>
            </Button>
          ) : null}
        </VStack>
      </UnstyledButton>
      {useCssAnchors ? copyButton : null}
    </>
  );
}

type AnyWallet = ExternallyOwnedAccount | BareWallet | DeviceAccount;

interface WalletGroupInfo {
  id: string;
  walletContainer: {
    wallets: AnyWallet[];
  };
}

export function WalletList({
  walletGroups,
  walletsMeta,
  selectedAddress,
  showAddressValues,
  showExploreRewards,
  onSelect,
}: {
  walletGroups: WalletGroupInfo[];
  walletsMeta: WalletMeta[] | null;
  selectedAddress: string;
  showAddressValues: boolean;
  showExploreRewards: boolean;
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  const items: Item[] = [];
  /**
   * If CSS anchor positioning is supported, we use it to avoid
   * nesting buttons, which is invalid per html spec, but still works ¯\_(ツ)_/¯
   */
  const supportsCssAnchor = CSS.supports('anchor-name: --name');
  for (const group of walletGroups) {
    for (const wallet of group.walletContainer.wallets) {
      const walletMeta = walletsMeta?.find(
        (meta) =>
          normalizeAddress(meta.address) === normalizeAddress(wallet.address)
      );
      const exploreRewardsUrl =
        showExploreRewards && walletMeta?.membership.newRewards
          ? `${ZERION_ORIGIN}/rewards?section=rewards&address=${wallet.address}`
          : null;
      const key = `${group.id}-${wallet.address}`;
      items.push({
        key,
        isInteractive: true,
        pad: false,
        component: (
          <WalletListItem
            onClick={() => {
              onSelect(wallet);
            }}
            wallet={wallet}
            groupId={group.id}
            useCssAnchors={supportsCssAnchor}
            showAddressValues={showAddressValues}
            exploreRewardsUrl={exploreRewardsUrl}
            isSelected={
              normalizeAddress(wallet.address) ===
              normalizeAddress(selectedAddress)
            }
          />
        ),
      });
    }
  }

  return <SurfaceList items={items} style={{ padding: 0 }} />;
}
