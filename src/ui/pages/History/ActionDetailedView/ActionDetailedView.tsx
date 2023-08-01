import React, { useMemo } from 'react';
import { capitalize } from 'capitalize-ts';
import type { Networks } from 'src/modules/networks/Networks';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { createChain } from 'src/modules/networks/Chain';
import type {
  AnyAddressAction,
  ClientTransactionStatus,
} from 'src/modules/ethereum/transactions/addressAction';
import { ApprovalInfo, TransferInfo } from './components/TransferInfo';
import { ExplorerLink } from './components/ExplorerLink';
import { HashButton } from './components/HashButton';
import { CollectionLine } from './components/CollectionLine';
import { RateLine } from './components/RateLine';
import { SenderReceiverLine } from './components/SenderReceiverLine';
import { FeeLine } from './components/FeeLine';

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function ActionDetailedView({
  action,
  address,
  networks,
}: {
  action: AnyAddressAction;
  address?: string;
  networks: Networks;
}) {
  const chain = useMemo(() => createChain(action.transaction.chain), [action]);
  const network = useMemo(
    () => networks.getNetworkByName(chain),
    [networks, chain]
  );

  const actionDate = useMemo(() => {
    return dateFormatter.format(new Date(action.datetime));
  }, [action.datetime]);

  const outgoingTransfers = action.content?.transfers?.outgoing;
  const incomingTransfers = action.content?.transfers?.incoming;

  const isFailed =
    action.transaction.status === 'failed' ||
    (action.transaction.status as ClientTransactionStatus) === 'dropped';

  const isPending = action.transaction.status === 'pending';

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
        <UIText
          kind="body/accent"
          color={
            isPending
              ? 'var(--notice-500)'
              : isFailed
              ? 'var(--negative-500)'
              : undefined
          }
        >
          {`${action.type.display_value}${
            isFailed || isPending
              ? ` (${capitalize(action.transaction.status)})`
              : ''
          }`}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {actionDate}
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
              gridTemplateColumns: network ? '1fr auto auto' : undefined,
            }}
          >
            {network ? (
              <HStack
                gap={8}
                alignItems="center"
                style={{ gridTemplateColumns: 'auto 1fr' }}
              >
                <NetworkIcon
                  src={network?.icon_url}
                  chainId={network?.external_id || ''}
                  size={24}
                  name={network?.name || null}
                />
                <UIText
                  kind="small/accent"
                  title={network?.name}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {network?.name}
                </UIText>
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
