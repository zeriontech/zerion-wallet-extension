import React, { useState } from 'react';
import { motion } from 'motion/react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

const AVATAR_SIZE = 36;
const AVATAR_RADIUS = 10;

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

  const truncated = truncateAddress(normalizeAddress(address), 5);
  const title = localName || firstHandle || truncated;
  const subtitle = truncated;

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
      </VStack>
    </>
  );
}
