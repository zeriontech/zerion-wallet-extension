import type { AddressAction } from 'defi-sdk';
import React from 'react';
import { animated, useSpring } from 'react-spring';
import { createChain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { useHoverAnimation } from 'src/ui/shared/useHoverAnimation';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import * as helperStyles from 'src/ui/style/helpers.module.css';

const ICON_SIZE = 20;

export function ExplorerLink({
  action,
  networks,
}: {
  action: AddressAction;
  networks: Networks;
}) {
  const { isBooped, handleMouseEnter } = useHoverAnimation(150);

  const iconStyle = useSpring({
    display: 'flex',
    x: isBooped ? 5 : 0,
    config: { tension: 300, friction: 15 },
  });

  return (
    <UnstyledAnchor
      href={networks.getExplorerTxUrlByName(
        createChain(action.transaction.chain),
        action.transaction.hash
      )}
      rel="noopener noreferrer"
      onClick={openInNewWindow}
      onMouseEnter={handleMouseEnter}
      className={helperStyles.hoverUnderline}
      style={{ justifySelf: 'end', color: 'var(--primary)' }}
    >
      <HStack gap={4} alignItems="center">
        <UIText kind="small/accent">Explorer</UIText>
        <animated.div style={iconStyle}>
          <LinkIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </animated.div>
      </HStack>
    </UnstyledAnchor>
  );
}
