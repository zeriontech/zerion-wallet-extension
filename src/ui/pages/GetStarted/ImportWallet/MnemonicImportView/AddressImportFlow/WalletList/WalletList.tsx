import React, { useState } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import type { DerivationPathType } from 'src/shared/wallet/derivation-paths';
import { getIndexFromPath } from 'src/shared/wallet/derivation-paths';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';

interface Props {
  wallets: BareWallet[];
  existingAddressesSet: Set<string>;
  listTitle: React.ReactNode;
  renderDetail: null | ((index: number) => React.ReactNode);
  renderMedia?: (index: number) => React.ReactNode;
  values: Set<string>;
  onSelect: (value: string) => void;
  initialCount?: number;
  derivationPathType?: DerivationPathType;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore: () => void;
  showMoreText?: string;
}

export function WalletListPresentation({
  wallets,
  existingAddressesSet,
  listTitle,
  renderDetail,
  renderMedia,
  values,
  onSelect,
  derivationPathType = 'bip44',
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  showMoreText = 'Show More',
}: Props) {
  return (
    <VStack gap={8}>
      {listTitle ? <UIText kind="small/accent">{listTitle}</UIText> : null}
      <SurfaceList
        items={wallets
          .map<Item>((wallet, index) => ({
            key: wallet.address,
            onClick: existingAddressesSet.has(normalizeAddress(wallet.address))
              ? undefined
              : () => onSelect(wallet.address),
            component: (
              <HStack
                gap={8}
                alignItems="center"
                justifyContent="space-between"
                style={{
                  gridTemplateColumns: 'minmax(min-content, 18px) 1fr auto',
                }}
              >
                <UIText
                  kind="body/regular"
                  color="var(--neutral-500)"
                  title={`Derivation path: ${wallet.mnemonic?.path}`}
                  style={{ cursor: 'help' }}
                >
                  {wallet.mnemonic
                    ? getIndexFromPath(wallet.mnemonic.path, derivationPathType)
                    : null}
                </UIText>
                {renderMedia ? (
                  renderMedia(index)
                ) : (
                  <Media
                    image={
                      <WalletAvatar
                        address={wallet.address}
                        active={false}
                        size={40}
                        borderRadius={4}
                      />
                    }
                    text={<WalletDisplayName wallet={wallet} />}
                    vGap={0}
                    detailText={renderDetail?.(index)}
                  />
                )}
                {existingAddressesSet.has(normalizeAddress(wallet.address)) ? (
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Already added
                  </UIText>
                ) : (
                  <span>
                    <AnimatedCheckmark
                      checked={values.has(wallet.address)}
                      checkedColor="var(--primary)"
                    />
                  </span>
                )}
              </HStack>
            ),
          }))
          .concat(
            hasMore
              ? [
                  {
                    key: -1,
                    isInteractive: true,
                    pad: false,
                    component: (
                      <SurfaceItemButton
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                      >
                        <UIText kind="body/regular" color="var(--primary)">
                          <HStack alignItems="center" gap={8}>
                            {isLoadingMore ? <CircleSpinner /> : null}
                            {showMoreText}
                          </HStack>
                        </UIText>
                      </SurfaceItemButton>
                    ),
                  },
                ]
              : []
          )}
      />
    </VStack>
  );
}

export function WalletList({
  wallets,
  initialCount,
  ...props
}: Omit<Props, 'hasMore' | 'onLoadMore'>) {
  const [count, setCount] = useState(initialCount ?? wallets.length);
  return (
    <WalletListPresentation
      wallets={wallets.slice(0, count)}
      hasMore={count < wallets.length}
      onLoadMore={() => setCount((count) => count + 3)}
      showMoreText={count === 0 ? 'Show' : undefined}
      {...props}
    />
  );
}
