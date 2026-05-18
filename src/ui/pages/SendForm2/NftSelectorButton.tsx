import React, { forwardRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import cn from 'classnames';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';
import * as styles from './AssetSelectorButton.module.css';

const EMPTY_KEY = '__empty__';

function getDisplayName(position: NftPosition): string {
  return (
    position.nft.name ||
    position.nft.metadata.name ||
    position.nft.collection.name ||
    `#${position.nft.tokenId}`
  );
}

type NftSelectorButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> & {
  position: NftPosition | null;
  onClick: () => void;
};

export const NftSelectorButton = forwardRef<
  HTMLButtonElement,
  NftSelectorButtonProps
>(function NftSelectorButton({ position, onClick, className, ...rest }, ref) {
  const contentKey = position ? position.id : EMPTY_KEY;
  const displayName = position ? getDisplayName(position) : 'Select NFT';

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={cn(styles.button, className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <HStack gap={4} alignItems="center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={contentKey}
            initial={{ y: 6, filter: 'blur(2px)', opacity: 0 }}
            animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
            exit={{ y: -6, filter: 'blur(2px)', opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <UIText
              kind="headline/h3"
              color={position ? undefined : 'var(--neutral-500)'}
              style={{
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </UIText>
          </motion.div>
        </AnimatePresence>
        <ChevronDownIcon className={styles.chevron} />
      </HStack>
    </button>
  );
});
