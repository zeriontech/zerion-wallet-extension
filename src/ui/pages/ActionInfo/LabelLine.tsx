import React, { useCallback } from 'react';
import { capitalize } from 'capitalize-ts';
import { useQuery } from '@tanstack/react-query';
import { animated } from '@react-spring/web';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { walletPort } from 'src/ui/shared/channels';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import type { ActionLabel } from 'src/modules/zerion-api/requests/wallet-get-actions';

const ICON_SIZE = 20;

function LabelInfo({ label }: { label: ActionLabel }) {
  const { wallet, contract } = label;
  const address = wallet?.address || contract?.address || '';
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });
  const { style: successIconStyle, trigger: successCopyTrigger } =
    useTransformTrigger({ x: 2 });

  const { data: localWallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', address],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', { address, groupId: null }),
    enabled: Boolean(address),
    suspense: false,
  });

  const walletName = localWallet?.name || wallet?.name || null;
  const contractName = contract?.dapp.name || null;
  const contractIconUrl = contract?.dapp.iconUrl || null;

  const handleClick = useCallback(() => {
    handleCopy();
    successCopyTrigger();
  }, [handleCopy, successCopyTrigger]);

  return (
    <UnstyledButton
      onClick={handleClick}
      disabled={!address}
      onMouseEnter={hoverTrigger}
      className={address ? helperStyles.hoverUnderline : undefined}
      style={{ justifySelf: 'end', cursor: address ? 'pointer' : 'auto' }}
    >
      <HStack
        gap={8}
        alignItems="center"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        {contractIconUrl ? (
          <TokenIcon
            src={contractIconUrl}
            title={contractName || 'Contract icon'}
            size={ICON_SIZE}
            style={{ borderRadius: 4 }}
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
            {contractName || walletName}
          </UIText>
          {address ? (
            isSuccess ? (
              <animated.div style={{ ...successIconStyle, display: 'flex' }}>
                <SuccessIcon
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    color: 'var(--positive-500)',
                  }}
                />
              </animated.div>
            ) : (
              <animated.div style={{ ...iconStyle, display: 'flex' }}>
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

export function LabelLine({ label }: { label: ActionLabel }) {
  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      {label.displayTitle ? (
        <UIText kind="small/regular">{capitalize(label.displayTitle)}</UIText>
      ) : null}
      <LabelInfo label={label} />
    </HStack>
  );
}
