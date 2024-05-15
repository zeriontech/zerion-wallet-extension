import React from 'react';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Button } from 'src/ui/ui-kit/Button';
import CheckIcon from 'jsx:src/ui/assets/check-circle-thin.svg';
import { noValueDash } from 'src/ui/shared/typography';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PageBottom } from 'src/ui/components/PageBottom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import { ValueCell } from '../shared/ValueCell';

export function NetworkCreateSuccess({
  chainConfig,
  paddingTop = 64,
  onDone,
}: {
  chainConfig: AddEthereumChainParameter;
  paddingTop?: number;
  onDone: () => void;
}) {
  return (
    <PageColumn>
      <NavigationTitle
        urlBar="none"
        title={null}
        documentTitle="Network added successfully"
      />
      <Spacer height={paddingTop} />
      <CheckIcon
        style={{
          display: 'block',
          marginInline: 'auto',
          width: 62,
          height: 62,
          color: 'var(--primary-500)',
        }}
      />
      <Spacer height={16} />
      <UIText
        kind="headline/h1"
        style={{
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {chainConfig.chainName || chainConfig.chainId}
      </UIText>
      <UIText kind="headline/h3" style={{ textAlign: 'center' }}>
        added successfully!
      </UIText>
      <Spacer height={32} />
      <VStack gap={8} style={{ textAlign: 'center' }}>
        <ValueCell
          label="RPC URL"
          value={chainConfig.rpcUrls[0] || noValueDash}
        />
        <ValueCell label="Chain ID" value={chainConfig.chainId} />
        <ValueCell
          label="Currency Symbol"
          value={chainConfig.nativeCurrency.symbol ?? noValueDash}
        />
        <ValueCell
          label="Block Explorer URL"
          value={chainConfig.blockExplorerUrls?.[0] || noValueDash}
        />
      </VStack>
      <PageBottom />
      <Button style={{ marginTop: 'auto' }} onClick={onDone}>
        Close
      </Button>
      <PageBottom />
    </PageColumn>
  );
}
