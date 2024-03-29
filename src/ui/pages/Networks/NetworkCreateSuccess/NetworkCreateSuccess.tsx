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
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { ValueCell } from '../shared/ValueCell';

export function NetworkCreateSuccess({
  network,
  paddingTop = 64,
  onDone,
}: {
  network: NetworkConfig;
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
        {network.name || network.external_id}
      </UIText>
      <UIText kind="headline/h3" style={{ textAlign: 'center' }}>
        added successfully!
      </UIText>
      <Spacer height={32} />
      <VStack gap={8} style={{ textAlign: 'center' }}>
        <ValueCell
          label="RPC URL"
          value={network.rpc_url_public?.[0] || noValueDash}
        />
        <ValueCell label="Chain ID" value={network.external_id} />
        <ValueCell
          label="Currency Symbol"
          value={network.native_asset?.symbol ?? noValueDash}
        />
        <ValueCell
          label="Block Explorer URL"
          value={network.explorer_home_url || noValueDash}
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
