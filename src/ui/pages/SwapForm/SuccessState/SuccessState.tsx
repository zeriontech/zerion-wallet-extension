import React from 'react';
import { animated, useTrail } from '@react-spring/web';
import type { SwapFormState } from '@zeriontech/transactions';
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
import type { BareAddressPosition } from '../BareAddressPosition';

function SwapVisualization({
  spendPosition,
  receivePosition,
  spendInput,
  receiveInput,
}: {
  spendPosition: BareAddressPosition;
  receivePosition: BareAddressPosition;
  spendInput: string;
  receiveInput: string;
}) {
  return (
    <VStack gap={4} style={{ justifyItems: 'center' }}>
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
      <ArrowDown style={{ color: 'var(--neutral-500)' }} />
      <Media
        image={
          <TokenIcon
            src={receivePosition.asset.icon_url}
            symbol={receivePosition.asset.symbol}
          />
        }
        text={
          <UIText kind="headline/h2">
            {formatTokenValue(receiveInput)} {receivePosition.asset.symbol}
          </UIText>
        }
        detailText={null}
      />
    </VStack>
  );
}

export function SuccessState({
  paddingTop = 64,
  swapFormState,
  spendPosition,
  receivePosition,
  hash,
  onDone,
}: {
  swapFormState: SwapFormState;
  spendPosition: BareAddressPosition;
  receivePosition: BareAddressPosition;
  hash: string | null;
  onDone: () => void;
  paddingTop?: number;
}) {
  const { networks } = useNetworks();
  const { chainInput, spendInput, receiveInput } = swapFormState;
  invariant(
    chainInput && spendInput && receiveInput,
    'Required Form values are missing'
  );
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
  const chain = createChain(chainInput);
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
          Swapping
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
        <SwapVisualization
          spendInput={spendInput}
          receiveInput={receiveInput}
          spendPosition={spendPosition}
          receivePosition={receivePosition}
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
            >
              {networks.getExplorerNameById(networks.getChainId(chain))}
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
