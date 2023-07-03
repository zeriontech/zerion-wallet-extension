import React, { useMemo } from 'react';
import type { AddressAction } from 'defi-sdk';
import type { Networks } from 'src/modules/networks/Networks';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { createChain } from 'src/modules/networks/Chain';
import {
  ApprovalInfo,
  CollectionLine,
  ExplorerLink,
  FeeLine,
  HashButton,
  RateLine,
  SenderReceiverLine,
  TransferInfo,
} from './components';

export function ActionDetailedView({
  action,
  address,
  networks,
}: {
  action: AddressAction;
  address?: string;
  networks: Networks;
}) {
  const chain = useMemo(() => createChain(action.transaction.chain), [action]);
  const network = useMemo(
    () => networks.getNetworkByName(chain),
    [networks, chain]
  );

  const outgoingTransfers = action.content?.transfers?.outgoing;
  const incomingTransfers = action.content?.transfers?.incoming;

  const hasTransferInfo =
    outgoingTransfers?.length ||
    incomingTransfers?.length ||
    action.content?.single_asset;

  return (
    <VStack
      gap={14}
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
      {hasTransferInfo ? (
        <VStack gap={4}>
          {outgoingTransfers?.length ? (
            <TransferInfo
              transfers={outgoingTransfers}
              address={address}
              title={incomingTransfers?.length ? 'Send' : undefined}
              direction="outgoing"
              chain={chain}
            />
          ) : null}
          {incomingTransfers?.length ? (
            <TransferInfo
              transfers={incomingTransfers}
              address={address}
              title={outgoingTransfers?.length ? 'Receive' : undefined}
              direction="incoming"
              chain={chain}
            />
          ) : null}
          {action.content?.single_asset ? (
            <ApprovalInfo
              approvalInfo={action.content.single_asset}
              address={address}
              chain={chain}
            />
          ) : null}
        </VStack>
      ) : null}
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
            <HashButton hash={action.transaction.hash} />
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
