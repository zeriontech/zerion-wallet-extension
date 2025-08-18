import React, { useCallback, useMemo } from 'react';
import { animated } from '@react-spring/web';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UIText } from 'src/ui/ui-kit/UIText';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { ActionTransaction } from 'src/modules/zerion-api/requests/wallet-get-actions';

const ICON_SIZE = 20;

function ExplorerLink({ url }: { url: string }) {
  const { style, trigger } = useTransformTrigger({ x: 2 });

  const urlPrepared = useMemo(
    () => (url ? prepareForHref(url)?.toString() : undefined),
    [url]
  );

  return (
    <UnstyledAnchor
      href={urlPrepared}
      target="_blank"
      rel="noopener noreferrer"
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

function HashButton({ hash }: { hash: string }) {
  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });
  const { style: successIconStyle, trigger: successCopyTrigger } =
    useTransformTrigger({ x: 2 });
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: hash });

  const handleClick = useCallback(() => {
    handleCopy();
    successCopyTrigger();
  }, [handleCopy, successCopyTrigger]);

  return (
    <UnstyledButton
      onClick={handleClick}
      onMouseEnter={hoverTrigger}
      className={helperStyles.hoverUnderline}
      style={{
        justifySelf: 'end',
        color: isSuccess ? 'var(--positive-500)' : 'var(--primary)',
      }}
    >
      <HStack gap={4} alignItems="center">
        <UIText kind="small/accent">Hash</UIText>
        {isSuccess ? (
          <animated.div style={{ ...successIconStyle, display: 'flex' }}>
            <SuccessIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        ) : (
          <animated.div style={{ ...iconStyle, display: 'flex' }}>
            <CopyIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        )}
      </HStack>
    </UnstyledButton>
  );
}

export function ExplorerInfo({
  transaction,
}: {
  transaction: ActionTransaction;
}) {
  return (
    <HStack
      gap={16}
      alignItems="center"
      style={{ gridTemplateColumns: '1fr auto auto' }}
    >
      <HStack gap={8} alignItems="center">
        <NetworkIcon
          src={transaction.chain.iconUrl}
          size={24}
          name={transaction.chain.name}
        />
        <UIText kind="small/accent">{transaction.chain.name}</UIText>
      </HStack>
      {transaction.explorerUrl ? (
        <ExplorerLink url={transaction.explorerUrl} />
      ) : null}
      <HashButton hash={transaction.hash} />
    </HStack>
  );
}
