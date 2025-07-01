import React, { useState } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { inferIndexFromDerivationPath } from 'src/shared/wallet/derivation-paths';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';

interface BaseProps {
  wallets: MaskedBareWallet[];
  existingAddressesSet?: Set<string>;
  listTitle: React.ReactNode;
  renderDetail: null | ((index: number) => React.ReactNode);
  renderMedia?: (index: number) => React.ReactNode;
  values: Set<string>;
  onSelect: (value: string) => void;
  displayPathIndex?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore: null | (() => void);
  showMoreText?: string;
  paddingInline?: React.CSSProperties['paddingInline'];
}

interface Props extends BaseProps {
  initialCount?: number;
}

export function WalletListPresentation({
  wallets,
  existingAddressesSet,
  listTitle,
  renderDetail,
  renderMedia,
  values,
  onSelect,
  hasMore = false,
  isLoadingMore = false,
  displayPathIndex = true,
  onLoadMore,
  showMoreText = 'Show More',
  paddingInline = 8,
}: BaseProps) {
  return (
    <VStack gap={2}>
      {listTitle ? <UIText kind="small/accent">{listTitle}</UIText> : null}
      <SurfaceList
        items={wallets
          .map<Item>((wallet, index) => ({
            key: wallet.address,
            pad: false,
            isInteractive: true,
            component: (
              <SurfaceItemButton
                style={{ paddingInline }}
                onClick={
                  existingAddressesSet?.has(normalizeAddress(wallet.address))
                    ? undefined
                    : () => onSelect(wallet.address)
                }
              >
                <HStack
                  gap={8}
                  alignItems="center"
                  justifyContent="space-between"
                  style={{
                    gridTemplateColumns: displayPathIndex
                      ? 'minmax(min-content, 18px) 1fr auto'
                      : undefined,
                  }}
                >
                  {displayPathIndex ? (
                    <UIText
                      kind="body/regular"
                      color="var(--neutral-500)"
                      title={`Derivation path: ${wallet.mnemonic?.path}`}
                      style={{ cursor: 'help' }}
                    >
                      {wallet.mnemonic
                        ? inferIndexFromDerivationPath(wallet.mnemonic.path)
                        : null}
                    </UIText>
                  ) : null}
                  {renderMedia ? (
                    renderMedia(index)
                  ) : (
                    <Media
                      image={
                        <WalletAvatar
                          address={wallet.address}
                          active={false}
                          size={44}
                          borderRadius={12}
                        />
                      }
                      text={
                        <UIText kind="small/regular">
                          <WalletDisplayName wallet={wallet} />
                        </UIText>
                      }
                      vGap={0}
                      detailText={renderDetail?.(index)}
                    />
                  )}
                  {existingAddressesSet?.has(
                    normalizeAddress(wallet.address)
                  ) ? (
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
              </SurfaceItemButton>
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
                        onClick={() => onLoadMore?.()}
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
      onLoadMore={() => setCount((count) => count + 7)}
      showMoreText={count === 0 ? 'Show' : undefined}
      {...props}
    />
  );
}
