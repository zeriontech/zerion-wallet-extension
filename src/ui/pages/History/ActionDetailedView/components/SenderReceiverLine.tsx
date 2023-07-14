import React, { useCallback } from 'react';
import type { AddressAction } from 'defi-sdk';
import { capitalize } from 'capitalize-ts';
import { useQuery } from '@tanstack/react-query';
import { animated, useSpring } from '@react-spring/web';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { walletPort } from 'src/ui/shared/channels';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import { useHoverAnimation } from 'src/ui/shared/useHoverAnimation';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';

const ICON_SIZE = 20;

function SenderReceiver({
  label,
}: {
  label: NonNullable<AddressAction['label']>;
}) {
  const { icon_url, display_value, value } = label;
  const address =
    display_value.wallet_address || display_value.contract_address || '';
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  const { isBooped, handleMouseEnter } = useHoverAnimation(150);
  const { isBooped: isSuccessBooped, handleMouseEnter: handleCopyClick } =
    useHoverAnimation(150);

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

  const { data: wallet } = useQuery({
    queryKey: [`wallet/uiGetWalletByAddress/${address}`],
    queryFn: () => walletPort.request('uiGetWalletByAddress', { address }),
    enabled: Boolean(address),
    suspense: false,
  });

  const walletName = useProfileName(wallet || { address, name: null });

  const handleClick = useCallback(() => {
    handleCopy();
    handleCopyClick();
  }, [handleCopy, handleCopyClick]);

  return (
    <UnstyledButton
      onClick={handleClick}
      disabled={!address}
      onMouseEnter={handleMouseEnter}
      className={address ? helperStyles.hoverUnderline : undefined}
      style={{ justifySelf: 'end', cursor: address ? 'pointer' : 'auto' }}
    >
      <HStack
        gap={8}
        alignItems="center"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        {icon_url ? (
          <TokenIcon
            src={icon_url}
            size={ICON_SIZE}
            style={{ borderRadius: 4 }}
            title={value}
          />
        ) : address ? (
          <WalletAvatar size={ICON_SIZE} address={address} borderRadius={4} />
        ) : null}
        <HStack
          gap={4}
          alignItems="center"
          style={{ gridTemplateColumns: '1fr auto' }}
        >
          <UIText
            kind="small/accent"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {label.display_value.text || walletName}
          </UIText>
          {address ? (
            isSuccess ? (
              <animated.div style={successIconStyle}>
                <SuccessIcon
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    color: 'var(--positive-500)',
                  }}
                />
              </animated.div>
            ) : (
              <animated.div style={iconStyle}>
                <CopyIcon
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    color: 'var(--primary)',
                  }}
                />
              </animated.div>
            )
          ) : null}
        </HStack>
      </HStack>
    </UnstyledButton>
  );
}

export function SenderReceiverLine({ action }: { action: AddressAction }) {
  const { label } = action;

  if (!label) {
    return null;
  }

  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">{capitalize(label.type)}</UIText>
      <SenderReceiver label={label} />
    </HStack>
  );
}
