import React, { useMemo } from 'react';
import type { AddressPositionDappInfo } from 'defi-sdk';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import * as styles from './styles.module.css';

export function DappLink({
  dappInfo,
  style,
}: {
  dappInfo: AddressPositionDappInfo;
  style?: React.CSSProperties;
}) {
  const { url: rawUrl } = dappInfo;
  const url = useMemo(() => (rawUrl ? prepareForHref(rawUrl) : null), [rawUrl]);

  if (!url) {
    return null;
  }

  return (
    <Surface
      padding="8px 12px"
      className={styles.link}
      as={UnstyledAnchor}
      href={url.href}
      rel="noopener noreferrer"
      onClick={openInNewWindow}
      style={style}
    >
      <HStack gap={24} justifyContent="space-between" alignItems="center">
        <VStack gap={0}>
          <UIText kind="small/accent">Manage Positions</UIText>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            {url.hostname}
          </UIText>
        </VStack>
        <ArrowLeftTop className={styles.icon} />
      </HStack>
    </Surface>
  );
}
