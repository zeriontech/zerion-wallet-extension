import React from 'react';
import { animated, useTrail } from '@react-spring/web';
import { PageColumn } from 'src/ui/components/PageColumn';
import CheckIcon from 'jsx:src/ui/assets/check-circle-thin.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import ArrowDown from 'jsx:src/ui/assets/arrow-down.svg';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { VStack } from 'src/ui/ui-kit/VStack';
import { invariant } from 'src/shared/invariant';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import type { BareAddressPosition } from '../../SwapForm/BareAddressPosition';
import type { BridgeFormState } from '../shared/types';

export function SuccessState({
  paddingTop = 64,
  formState,
  spendPosition,
  receivePosition,
  hash,
  onDone,
}: {
  formState: BridgeFormState;
  spendPosition: BareAddressPosition;
  receivePosition: BareAddressPosition;
  hash: string | null;
  onDone: () => void;
  paddingTop?: number;
}) {
  const { networks } = useNetworks();

  const { spendInput, spendChainInput, receiveInput, receiveChainInput } =
    formState;

  invariant(
    spendChainInput && receiveChainInput && spendInput && receiveInput,
    'Required form values are missing'
  );
  const trail = useTrail(4, {
    config: { tension: 400 },
    from: {
      opacity: 0,
      y: 40,
    },
    to: {
      opacity: 1,
      y: 0,
    },
  });

  if (!networks) {
    return <ViewLoading />;
  }
  const spendChain = createChain(spendChainInput);
  const spendChainName = networks.getChainName(spendChain);

  const receiveChain = createChain(receiveChainInput);
  const receiveChainName = networks.getChainName(receiveChain);

  return (
    <PageColumn>
      <NavigationTitle title={null} documentTitle="Bridge" />
      <Spacer height={paddingTop} />
      <animated.div style={trail[0]}>
        <CheckIcon
          style={{
            display: 'block',
            marginInline: 'auto',
            width: 72,
            height: 72,
            color: 'var(--primary-500)',
          }}
        />
      </animated.div>
      <Spacer height={32} />
      <animated.div style={trail[1]}>
        <UIText kind="headline/h1" style={{ textAlign: 'center' }}>
          Transfering
        </UIText>
      </animated.div>
      <Spacer height={32} />
      <animated.div style={trail[2]}>
        <VStack gap={4} style={{ justifyItems: 'center' }}>
          <VStack gap={8}>
            <Media
              image={
                <TokenIcon
                  src={spendPosition.asset.icon_url}
                  symbol={spendPosition.asset.symbol}
                />
              }
              text={
                <UIText kind="headline/h2">
                  {formatTokenValue(spendInput)} {spendPosition.asset.symbol}
                </UIText>
              }
              detailText={null}
            />
            <UIText kind="small/accent" style={{ textAlign: 'center' }}>
              <HStack gap={8}>
                <span>on</span>
                <HStack gap={10}>
                  <NetworkIcon
                    size={20}
                    name={spendChainName}
                    src={networks.getNetworkByName(spendChain)?.icon_url}
                  />{' '}
                  {spendChainName}
                </HStack>
              </HStack>
            </UIText>
          </VStack>
          <ArrowDown style={{ color: 'var(--neutral-500)' }} />
          <VStack gap={8}>
            <Media
              image={
                <TokenIcon
                  src={receivePosition.asset.icon_url}
                  symbol={receivePosition.asset.symbol}
                />
              }
              text={
                <UIText kind="headline/h2">
                  {formatTokenValue(receiveInput)}{' '}
                  {receivePosition.asset.symbol}
                </UIText>
              }
              detailText={null}
            />
            <UIText kind="small/accent">
              <HStack gap={8} justifyContent="center">
                <span>on</span>
                <HStack gap={10}>
                  <NetworkIcon
                    size={20}
                    name={receiveChainName}
                    src={networks.getNetworkByName(receiveChain)?.icon_url}
                  />{' '}
                  {receiveChainName}
                </HStack>
              </HStack>
            </UIText>
          </VStack>
        </VStack>
      </animated.div>
      <PageBottom />
      <VStack gap={16} style={{ marginTop: 'auto', textAlign: 'center' }}>
        {hash ? (
          <UIText kind="caption/regular" color="var(--neutral-600)">
            The transaction is still pending.
            <br />
            You can check the status on{' '}
            <TextAnchor
              style={{ color: 'var(--primary)' }}
              href={networks.getExplorerTxUrlByName(spendChain, hash)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {networks.getExplorerNameByChainName(spendChain)}
            </TextAnchor>
            .
          </UIText>
        ) : null}
        <Button style={{ marginTop: 'auto' }} onClick={onDone}>
          Done
        </Button>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
