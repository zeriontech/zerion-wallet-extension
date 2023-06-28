import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import type { AddressAction } from 'defi-sdk';
import type { Networks } from 'src/modules/networks/Networks';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { createChain } from 'src/modules/networks/Chain';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';

const ICON_SIZE = 20;

function useHoverAnimationState(timing: number) {
  const [isBooped, setIsBooped] = useState(false);

  useEffect(() => {
    if (!isBooped) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsBooped(false);
    }, timing);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBooped, timing]);

  return {
    isBooped,
    handleMouseEnter: useCallback(() => setIsBooped(true), []),
  };
}

function ExplorerLink({
  action,
  networks,
}: {
  action: AddressAction;
  networks: Networks;
}) {
  const { isBooped, handleMouseEnter } = useHoverAnimationState(150);

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
    >
      <HStack gap={4} alignItems="center" style={{ color: 'var(--primary' }}>
        <UIText kind="small/accent">Explorer</UIText>
        <animated.div style={iconStyle}>
          <LinkIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </animated.div>
      </HStack>
    </UnstyledAnchor>
  );
}

function CopyButton({ hash }: { hash: string }) {
  const { isBooped, handleMouseEnter } = useHoverAnimationState(150);
  const { isBooped: isSuccessBooped, handleMouseEnter: handleCopyClick } =
    useHoverAnimationState(150);
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: hash });

  const successIconStyle = useSpring({
    display: 'flex',
    transform: isSuccessBooped ? 'scale(1.2)' : 'scale(1)',
    config: { tension: 300, friction: 15 },
  });

  const iconStyle = useSpring({
    display: 'flex',
    x: isBooped ? 5 : 0,
    config: { tension: 300, friction: 15 },
  });

  return (
    <UnstyledButton
      onClick={() => {
        handleCopy();
        handleCopyClick();
      }}
      onMouseEnter={handleMouseEnter}
      className={helperStyles.hoverUnderline}
    >
      <HStack
        gap={4}
        alignItems="center"
        style={{ color: isSuccess ? 'var(--positive-500)' : 'var(--primary' }}
      >
        <UIText kind="small/accent">Copy</UIText>
        {isSuccess ? (
          <animated.div style={successIconStyle}>
            <SuccessIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        ) : (
          <animated.div style={iconStyle}>
            <CopyIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        )}
      </HStack>
    </UnstyledButton>
  );
}

export function ActionDetailedView({
  action,
  networks,
}: {
  action: AddressAction;
  networks: Networks;
}) {
  const network = useMemo(
    () => networks.getNetworkByName(createChain(action.transaction.chain)),
    [networks, action]
  );

  return (
    <VStack
      gap={16}
      style={{ ['--surface-background-color' as string]: 'var(--white)' }}
    >
      <VStack gap={0} style={{ justifyItems: 'center' }}>
        <UIText kind="body/accent">{action.type.display_value}</UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {new Intl.DateTimeFormat('en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(action.datetime))}
        </UIText>
      </VStack>
      <Surface padding={16}>
        <VStack gap={24}>
          <HStack
            gap={24}
            alignItems="center"
            style={{ gridTemplateColumns: network ? '2fr 1fr 1fr' : '1fr 1fr' }}
          >
            {network ? (
              <HStack gap={8} alignItems="center">
                <NetworkIcon
                  src={network?.icon_url}
                  chainId={network?.external_id || ''}
                  size={24}
                  name={network?.name || null}
                />
                <UIText kind="small/accent">{network?.name}</UIText>
              </HStack>
            ) : null}
            <ExplorerLink action={action} networks={networks} />
            <CopyButton hash={action.transaction.hash} />
          </HStack>
          <VStack gap={20}></VStack>
        </VStack>
      </Surface>
    </VStack>
  );
}
