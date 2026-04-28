import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import * as styles from './AssetSelectorButton.module.css';

const EMPTY_KEY = '__empty__';

export function AssetSelectorButton({
  position,
  onClick,
}: {
  position: FungiblePosition | null;
  onClick: () => void;
}) {
  const contentKey = position
    ? `${position.chain.id}-${position.fungible.id}`
    : EMPTY_KEY;

  return (
    <button
      type="button"
      className={styles.button}
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
            <HStack gap={8} alignItems="center">
              {position ? (
                <>
                  <div style={{ position: 'relative', width: 32, height: 32 }}>
                    <TokenIcon
                      src={position.fungible.iconUrl}
                      symbol={position.fungible.symbol}
                      size={32}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        borderRadius: 4,
                        border: '2px solid var(--white)',
                        overflow: 'hidden',
                        lineHeight: 0,
                      }}
                    >
                      <NetworkIcon
                        src={position.chain.iconUrl}
                        name={position.chain.name}
                        size={14}
                      />
                    </div>
                  </div>
                  <UIText kind="headline/h3">{position.fungible.symbol}</UIText>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'var(--neutral-300)',
                    }}
                  />
                  <UIText kind="headline/h3" color="var(--neutral-500)">
                    Select
                  </UIText>
                </>
              )}
            </HStack>
          </motion.div>
        </AnimatePresence>
        <ChevronDownIcon className={styles.chevron} />
      </HStack>
    </button>
  );
}
