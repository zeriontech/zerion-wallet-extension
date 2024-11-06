import React from 'react';
import { animated, useTrail } from '@react-spring/web';
import type { SendFormState, SendFormView } from '@zeriontech/transactions';
import { PageColumn } from 'src/ui/components/PageColumn';
import CheckIcon from 'jsx:src/ui/assets/check-circle-thin.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
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
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { TransferVisualization } from '../TransferVisualization';

export function GasbackDecorated({ value }: { value: number }) {
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      style={{
        padding: '8px 12px',
        borderRadius: 12,
        background:
          'linear-gradient(90deg, rgba(160, 36, 239, 0.20) 0%, rgba(253, 187, 108, 0.20) 100%)',
      }}
    >
      <UIText kind="small/regular">Gasback</UIText>
      <UIText
        kind="small/accent"
        style={{
          background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {new Intl.NumberFormat('en').format(value)}
      </UIText>
    </HStack>
  );
}

export interface SendFormSnapshot {
  state: SendFormState;
  tokenItem: SendFormView['tokenItem'];
  nftItem: SendFormView['nftItem'];
}

export function SuccessState({
  paddingTop = 64,
  sendFormSnapshot,
  gasbackValue,
  hash,
  onDone,
}: {
  paddingTop?: number;
  sendFormSnapshot: SendFormSnapshot;
  gasbackValue: number | null;
  hash: string | null;
  onDone: () => void;
}) {
  const { networks } = useNetworks();
  const { tokenItem, nftItem, state } = sendFormSnapshot;
  const { type, tokenChain, nftChain, to, tokenValue } = state;
  const currentChain = type === 'token' ? tokenChain : nftChain;
  invariant(to && currentChain, 'Required Form values are missing');
  const trail = useTrail(4, {
    config: { tension: 400 },
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
  });
  if (!networks) {
    return <ViewLoading />;
  }
  const chain = createChain(currentChain);
  const chainName = networks.getChainName(chain);
  return (
    <PageColumn>
      <NavigationTitle urlBar="none" title="Send Success" />
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
          Transferring
        </UIText>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <UIText kind="small/accent" style={{ textAlign: 'center' }}>
            <HStack gap={8}>
              <span>on</span>
              <HStack gap={10}>
                <NetworkIcon
                  size={20}
                  name={chainName}
                  src={networks.getNetworkByName(chain)?.icon_url}
                />{' '}
                {chainName}
              </HStack>
            </HStack>
          </UIText>
        </div>
      </animated.div>
      <Spacer height={32} />
      {type === 'token' && tokenItem ? (
        <animated.div style={trail[2]}>
          <TransferVisualization
            tokenItem={tokenItem}
            to={to}
            amount={tokenValue ?? '0'}
          />
        </animated.div>
      ) : type === 'nft' && nftItem ? (
        <animated.div style={trail[2]}>
          <TransferVisualization
            nftItem={nftItem}
            to={to}
            amount={tokenValue ?? '0'}
          />
        </animated.div>
      ) : null}
      {gasbackValue && FEATURE_LOYALTY_FLOW === 'on' ? (
        <animated.div style={trail[3]}>
          <div style={{ paddingInline: 32 }}>
            <Spacer height={32} />
            <GasbackDecorated value={gasbackValue} />
          </div>
        </animated.div>
      ) : null}
      <PageBottom />
      <VStack gap={16} style={{ marginTop: 'auto', textAlign: 'center' }}>
        {hash ? (
          <UIText kind="caption/regular" color="var(--neutral-600)">
            The transaction is still pending.
            <br />
            You can check the status on{' '}
            <TextAnchor
              style={{ color: 'var(--primary)' }}
              href={networks.getExplorerTxUrlByName(chain, hash)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {networks.getExplorerNameByChainName(chain)}
            </TextAnchor>
            .
          </UIText>
        ) : null}
        <Button style={{ marginTop: 'auto' }} onClick={onDone}>
          Close
        </Button>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
