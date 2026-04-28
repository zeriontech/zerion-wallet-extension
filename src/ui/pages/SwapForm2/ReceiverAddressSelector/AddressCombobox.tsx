import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Combobox,
  ComboboxItem,
  ComboboxPopover,
  ComboboxProvider,
  ComboboxGroup,
  ComboboxGroupLabel,
} from '@ariakit/react/combobox';
import { AnimatePresence, motion } from 'motion/react';
import { normalizedContains } from 'normalized-contains';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { resolveDomain } from 'src/modules/name-service';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { AddressItem } from './useReceiverAddressItems';
import * as styles from './AddressCombobox.module.css';

const AVATAR_SIZE = 36;
const AVATAR_RADIUS = 10;
const ITEM_AVATAR_SIZE = 28;
const ITEM_AVATAR_RADIUS = 8;

function matches(query: string | null, item: AddressItem) {
  if (!query) {
    return true;
  }
  const value = query.toLowerCase();
  return (
    normalizedContains(normalizeAddress(item.address).toLowerCase(), value) ||
    normalizedContains(
      truncateAddress(normalizeAddress(item.address), 4),
      value
    ) ||
    (item.name != null && normalizedContains(item.name.toLowerCase(), value))
  );
}

function getTitle(item: AddressItem) {
  return getWalletDisplayName(item);
}

function AvatarImage({
  src,
  size,
  borderRadius,
}: {
  src: string;
  size: number;
  borderRadius: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.92 }}
      animate={
        loaded
          ? { opacity: 1, filter: 'blur(0px)', scale: 1 }
          : { opacity: 0, filter: 'blur(6px)', scale: 0.92 }
      }
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

function ResolvedAvatar({
  address,
  previewUrl,
  size,
  borderRadius,
}: {
  address: string;
  previewUrl: string | null | undefined;
  size: number;
  borderRadius: number;
}) {
  if (previewUrl) {
    return (
      <AvatarImage src={previewUrl} size={size} borderRadius={borderRadius} />
    );
  }
  return (
    <motion.div
      key={`blockie-${address}`}
      initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.92 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'block' }}
    >
      <BlockieImg address={address} size={size} borderRadius={borderRadius} />
    </motion.div>
  );
}

function AvatarSlot({
  resolvedAddress,
  previewUrl,
  isLoading,
}: {
  resolvedAddress: string | null;
  previewUrl: string | null | undefined;
  isLoading: boolean;
}) {
  const showAvatar = Boolean(resolvedAddress) && !isLoading;
  return (
    <div
      className={styles.avatarSlot}
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_RADIUS,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showAvatar && resolvedAddress ? (
          <motion.div
            key={`avatar-${resolvedAddress}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.avatarContent}
          >
            <ResolvedAvatar
              address={resolvedAddress}
              previewUrl={previewUrl}
              size={AVATAR_SIZE}
              borderRadius={AVATAR_RADIUS}
            />
          </motion.div>
        ) : (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.skeleton}
            data-loading={isLoading ? 'true' : undefined}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_RADIUS,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddressItemRow({ item }: { item: AddressItem }) {
  const { data } = useWalletsMetaByChunks({
    addresses: [normalizeAddress(item.address)],
    suspense: false,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 10,
  });
  const meta = data?.at(0);
  const previewUrl = meta?.nft?.previewUrl ?? null;
  const firstHandle = meta?.identities?.[0]?.handle ?? null;

  const truncated = truncateAddress(normalizeAddress(item.address), 5);
  const localName = item.name || null;
  const title = localName || firstHandle || truncated;
  const subtitle = title === truncated ? null : truncated;

  return (
    <>
      <div
        className={styles.itemAvatar}
        style={{
          width: ITEM_AVATAR_SIZE,
          height: ITEM_AVATAR_SIZE,
          borderRadius: ITEM_AVATAR_RADIUS,
        }}
      >
        {previewUrl ? (
          <AvatarImage
            src={previewUrl}
            size={ITEM_AVATAR_SIZE}
            borderRadius={ITEM_AVATAR_RADIUS}
          />
        ) : (
          <BlockieImg
            address={item.address}
            size={ITEM_AVATAR_SIZE}
            borderRadius={ITEM_AVATAR_RADIUS}
          />
        )}
      </div>
      <VStack gap={0} style={{ overflow: 'hidden', minWidth: 0 }}>
        <UIText
          kind="body/accent"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </UIText>
        {subtitle ? (
          <UIText
            kind="caption/regular"
            color="var(--neutral-500)"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </UIText>
        ) : null}
      </VStack>
    </>
  );
}

export function AddressCombobox({
  items,
  value,
  onChange,
  onResolvedChange,
  anchorRef,
}: {
  items: AddressItem[];
  value: string;
  onChange: (value: string) => void;
  onResolvedChange: (value: string | null) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(true);

  const filteredItems = useMemo(() => {
    return items.filter((item) => matches(value, item));
  }, [items, value]);

  const recentItems = useMemo(
    () => filteredItems.filter((item) => item.groupType === 'recent'),
    [filteredItems]
  );
  const savedItems = useMemo(
    () => filteredItems.filter((item) => item.groupType === 'saved'),
    [filteredItems]
  );
  const showLabels = recentItems.length > 0 && savedItems.length > 0;

  const normalizedValue = normalizeAddress(value.trim());
  const { data: resolvedValue, isFetching: isResolving } = useQuery({
    queryKey: ['resolveReceiverAddress', normalizedValue],
    queryFn: () => {
      if (!normalizedValue) {
        return null;
      }
      if (
        isEthereumAddress(normalizedValue) ||
        isSolanaAddress(normalizedValue)
      ) {
        return normalizedValue;
      }
      const existingAddress = items.find(
        (item) =>
          item.name?.toLowerCase() === normalizedValue.toLowerCase() ||
          truncateAddress(normalizeAddress(item.address), 4) === normalizedValue
      )?.address;
      if (existingAddress) {
        return existingAddress;
      }
      return resolveDomain(normalizedValue || '');
    },
    suspense: false,
  });

  const resolvedAddress = resolvedValue ?? null;

  const { data: walletMeta, isLoading: isMetaLoading } = useWalletsMetaByChunks(
    {
      addresses: resolvedAddress ? [normalizeAddress(resolvedAddress)] : [],
      enabled: Boolean(resolvedAddress),
      suspense: false,
      useErrorBoundary: false,
      staleTime: 1000 * 60 * 10,
    }
  );
  const previewUrl = walletMeta?.at(0)?.nft?.previewUrl ?? null;
  const resolvedHandle = walletMeta?.at(0)?.identities?.[0]?.handle ?? null;

  const isTyping = value.trim().length > 0;
  const isResolvingInput = isTyping && !resolvedAddress && isResolving;
  const isLoadingAvatar =
    isResolvingInput ||
    (Boolean(resolvedAddress) && isMetaLoading && previewUrl == null);

  const onResolvedChangeRef = useRef(onResolvedChange);
  onResolvedChangeRef.current = onResolvedChange;

  useEffect(() => {
    onResolvedChangeRef.current(resolvedValue || null);
  }, [resolvedValue]);

  const handleSelect = useCallback(
    (item: AddressItem) => {
      onChange(getTitle(item));
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div className={styles.root}>
      <ComboboxProvider
        open={open}
        setOpen={setOpen}
        setValue={(newValue) => {
          onChange(newValue);
          setOpen(true);
        }}
        value={value}
      >
        <div className={styles.inputRow}>
          <AvatarSlot
            resolvedAddress={resolvedAddress}
            previewUrl={previewUrl}
            isLoading={isLoadingAvatar}
          />
          <VStack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <UIText kind="headline/h3">
              <Combobox
                className={styles.input}
                placeholder="Address, domain or identity"
                autoFocus={true}
                autoSelect={true}
              />
            </UIText>
            {(() => {
              if (!resolvedAddress) return null;
              const normalizedResolved = normalizeAddress(resolvedAddress);
              const typedIsResolvedAddress =
                normalizedResolved === normalizeAddress(value.trim());
              if (typedIsResolvedAddress) {
                return resolvedHandle ? (
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {resolvedHandle}
                  </UIText>
                ) : null;
              }
              return (
                <HStack
                  gap={0}
                  justifyContent="start"
                  style={{
                    gridTemplateColumns: 'minmax(0, auto) auto',
                  }}
                >
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    title={normalizedResolved}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {normalizedResolved.slice(0, -4)}
                  </UIText>
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    title={normalizedResolved}
                  >
                    {normalizedResolved.slice(-4)}
                  </UIText>
                </HStack>
              );
            })()}
          </VStack>
        </div>
        {filteredItems.length > 0 ? (
          <ComboboxPopover
            className={styles.popover}
            sameWidth={true}
            portal={true}
            gutter={4}
            getAnchorRect={
              anchorRef
                ? () => anchorRef.current?.getBoundingClientRect() ?? null
                : undefined
            }
          >
            {recentItems.length > 0 ? (
              <ComboboxGroup>
                {showLabels ? (
                  <ComboboxGroupLabel>
                    <UIText
                      kind="caption/accent"
                      color="var(--neutral-500)"
                      className={styles.sectionTitle}
                    >
                      Recents
                    </UIText>
                  </ComboboxGroupLabel>
                ) : null}
                {recentItems.map((item) => (
                  <ComboboxItem
                    key={`recent-${item.address}`}
                    className={styles.item}
                    value={getTitle(item)}
                    onClick={() => handleSelect(item)}
                  >
                    <AddressItemRow item={item} />
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            ) : null}
            {savedItems.length > 0 ? (
              <ComboboxGroup>
                {showLabels ? (
                  <ComboboxGroupLabel>
                    <UIText
                      kind="caption/accent"
                      color="var(--neutral-500)"
                      className={styles.sectionTitle}
                    >
                      Your wallets
                    </UIText>
                  </ComboboxGroupLabel>
                ) : null}
                {savedItems.map((item) => (
                  <ComboboxItem
                    key={`saved-${item.address}-${item.groupId}`}
                    className={styles.item}
                    value={getTitle(item)}
                    onClick={() => handleSelect(item)}
                  >
                    <AddressItemRow item={item} />
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            ) : null}
          </ComboboxPopover>
        ) : null}
      </ComboboxProvider>
    </div>
  );
}
