import React, { useMemo } from 'react';
import type { AddressPositionDappInfo } from 'defi-sdk';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { Button } from 'src/ui/ui-kit/Button';

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
    <Button
      as={UnstyledAnchor}
      href={url.href}
      size={36}
      kind="neutral"
      target="_blank"
      rel="noopener noreferrer"
      style={style}
    >
      <HStack gap={24} justifyContent="space-between" alignItems="center">
        <UIText kind="small/accent">Manage Positions</UIText>
        <ArrowLeftTop className="content-hover" />
      </HStack>
    </Button>
  );
}
