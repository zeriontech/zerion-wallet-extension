import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { FullAddress } from 'src/ui/components/FullAddress';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

const AVATAR_SIZE = 36;
const AVATAR_RADIUS = 10;

const HIDDEN = { opacity: 0, filter: 'blur(6px)', scale: 0.92 };
const VISIBLE = { opacity: 1, filter: 'blur(0px)', scale: 1 };

/**
 * Virtualized rows unmount when scrolled out of view, so a purely local
 * `loaded` flag replays the reveal animation on every scroll pass. Remembering
 * which sources were already revealed lets remounted rows appear instantly and
 * keeps the animation for images that are genuinely loading for the first time.
 */
const revealedSources = new Set<string>();

function AvatarImage({
  src,
  size,
  borderRadius,
}: {
  src: string;
  size: number;
  borderRadius: number;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  // Stable for the lifetime of the mount: the caller keys this component by src
  const [wasRevealed] = useState(() => revealedSources.has(src));
  const [loaded, setLoaded] = useState(wasRevealed);

  const markLoaded = useCallback(() => {
    revealedSources.add(src);
    setLoaded(true);
  }, [src]);

  // A cached image can finish loading before React attaches `onLoad`
  useEffect(() => {
    if (imgRef.current?.complete) {
      markLoaded();
    }
  }, [markLoaded]);

  return (
    <motion.img
      ref={imgRef}
      src={src}
      alt=""
      width={size}
      height={size}
      onLoad={markLoaded}
      onError={markLoaded}
      initial={wasRevealed ? false : HIDDEN}
      animate={loaded ? VISIBLE : HIDDEN}
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

export function AddressListItem({
  address,
  localName,
}: {
  address: string;
  localName: string | null;
}) {
  const { data } = useWalletsMetaByChunks({
    addresses: [normalizeAddress(address)],
    suspense: false,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 10,
  });
  const meta = data?.at(0);
  const previewUrl = meta?.nft?.previewUrl ?? null;
  const firstHandle = meta?.identities?.[0]?.handle ?? null;

  const normalizedAddress = normalizeAddress(address);
  const title =
    localName || firstHandle || truncateAddress(normalizedAddress, 5);

  return (
    <>
      <div
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_RADIUS,
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {previewUrl ? (
          <AvatarImage
            key={previewUrl}
            src={previewUrl}
            size={AVATAR_SIZE}
            borderRadius={AVATAR_RADIUS}
          />
        ) : (
          <BlockieImg
            address={address}
            size={AVATAR_SIZE}
            borderRadius={AVATAR_RADIUS}
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
        <FullAddress address={normalizedAddress} />
      </VStack>
    </>
  );
}
