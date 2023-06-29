import React, { useCallback, useMemo } from 'react';
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
import { useHoverAnimation } from 'src/ui/shared/useHoverAnimation';
import {
  ApprovalInfo,
  CollectionLine,
  FeeLine,
  RateLine,
  SenderReceiverLine,
  TransferInfo,
} from './components';

const ICON_SIZE = 20;

function ExplorerLink({
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
      style={{ justifySelf: 'end' }}
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
  const { isBooped, handleMouseEnter } = useHoverAnimation(150);
  const { isBooped: isSuccessBooped, handleMouseEnter: handleCopyClick } =
    useHoverAnimation(150);
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

  const handleClick = useCallback(() => {
    handleCopy();
    handleCopyClick();
  }, [handleCopy, handleCopyClick]);

  return (
    <UnstyledButton
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={helperStyles.hoverUnderline}
      style={{ justifySelf: 'end' }}
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
  address,
  networks,
}: {
  action: AddressAction;
  address?: string;
  networks: Networks;
}) {
  const network = useMemo(
    () => networks.getNetworkByName(createChain(action.transaction.chain)),
    [networks, action]
  );

  const outgoingTransfers = action.content?.transfers?.outgoing;
  const incomingTransfers = action.content?.transfers?.incoming;

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
      <VStack gap={4}>
        {outgoingTransfers?.length ? (
          <TransferInfo
            transfers={outgoingTransfers}
            address={address}
            title={incomingTransfers?.length ? 'Send' : undefined}
            direction="outgoing"
            chain={createChain(action.transaction.chain)}
          />
        ) : null}
        {incomingTransfers?.length ? (
          <TransferInfo
            transfers={incomingTransfers}
            address={address}
            title={outgoingTransfers?.length ? 'Receive' : undefined}
            direction="incoming"
            chain={createChain(action.transaction.chain)}
          />
        ) : null}
        {action.content?.single_asset ? (
          <ApprovalInfo
            asset={action.content.single_asset.asset}
            address={address}
          />
        ) : null}
      </VStack>
      <Surface padding={16}>
        <VStack gap={24}>
          <HStack
            gap={16}
            alignItems="center"
            style={{
              gridTemplateColumns: network ? '2fr auto auto' : undefined,
            }}
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
          <VStack gap={20}>
            <CollectionLine action={action} />
            <RateLine action={action} address={address} />
            <SenderReceiverLine action={action} />
            <FeeLine action={action} networks={networks} address={address} />
          </VStack>
        </VStack>
      </Surface>
    </VStack>
  );
}
