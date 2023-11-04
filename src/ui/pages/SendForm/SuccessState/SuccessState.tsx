import React from 'react';
import { animated, useTrail } from '@react-spring/web';
import type { SendFormState, FormPosition } from '@zeriontech/transactions';
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
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { TransferVisualization } from '../TransferVisualization';

export function SuccessState({
  paddingTop = 64,
  sendFormState,
  tokenItem,
  hash,
  onDone,
}: {
  paddingTop?: number;
  tokenItem: FormPosition;
  sendFormState: SendFormState;
  hash: string | null;
  onDone: () => void;
}) {
  const { networks } = useNetworks();
  const { tokenChain, to, tokenValue } = sendFormState;
  invariant(to && tokenChain, 'Required Form values are missing');
  const trail = useTrail(3, {
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
  const chain = createChain(tokenChain);
  const chainName = networks.getChainName(chain);
  return (
    <PageColumn>
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
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <UIText kind="small/accent" style={{ textAlign: 'center' }}>
            <HStack gap={8}>
              <span>on</span>
              <HStack gap={10}>
                <NetworkIcon
                  size={20}
                  name={chainName}
                  src={networks.getNetworkByName(chain)?.icon_url}
                  chainId={networks.getChainId(chain)}
                />{' '}
                {chainName}
              </HStack>
            </HStack>
          </UIText>
        </div>
      </animated.div>
      <Spacer height={32} />
      <animated.div style={trail[2]}>
        <TransferVisualization
          tokenItem={tokenItem}
          to={to}
          amount={tokenValue ?? '0'}
        />
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
              href={networks.getExplorerTxUrlByName(chain, hash)}
              rel="noopener noreferrer"
              target="_blank"
              onClick={openInNewWindow}
            >
              {networks.getExplorerNameById(networks.getChainId(chain))}
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
