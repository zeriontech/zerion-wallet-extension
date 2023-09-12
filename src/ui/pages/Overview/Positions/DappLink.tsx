import React, { useMemo } from 'react';
import type { AddressPositionDappInfo } from 'defi-sdk';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { invariant } from 'src/shared/invariant';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import * as styles from './styles.module.css';

export function DappLink({ dappInfo }: { dappInfo: AddressPositionDappInfo }) {
  const { url: rawUrl } = dappInfo;
  invariant(rawUrl, 'Dapp url must exists for dapp link to display');

  const url = useMemo(() => prepareForHref(rawUrl), [rawUrl]);
  invariant(url, `Dapp url for ${dappInfo.id} must be correct`);

  return (
    <Surface
      padding={'8px 12px'}
      className={styles.link}
      as={UnstyledAnchor}
      href={url.toString()}
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        openInNewWindow(e);
      }}
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
