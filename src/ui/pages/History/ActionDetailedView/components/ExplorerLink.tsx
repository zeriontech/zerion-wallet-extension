import React, { useMemo } from 'react';
import { animated } from '@react-spring/web';
import { createChain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';

const ICON_SIZE = 20;

export function ExplorerLink({
  action,
  networks,
}: {
  action: AnyAddressAction;
  networks: Networks;
}) {
  const { style, trigger } = useTransformTrigger({ x: 2 });

  const url = networks.getExplorerTxUrlByName(
    createChain(action.transaction.chain),
    action.transaction.hash
  );
  const urlPrepared = useMemo(
    () => (url ? prepareForHref(url)?.toString() : undefined),
    [url]
  );
  return (
    <UnstyledAnchor
      href={urlPrepared}
      rel="noopener noreferrer"
      onClick={openInNewWindow}
      onMouseEnter={trigger}
      className={helperStyles.hoverUnderline}
      style={{ justifySelf: 'end', color: 'var(--primary)' }}
    >
      <HStack gap={4} alignItems="center">
        <UIText kind="small/accent">Explorer</UIText>
        <animated.div style={{ ...style, display: 'flex' }}>
          <LinkIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </animated.div>
      </HStack>
    </UnstyledAnchor>
  );
}
