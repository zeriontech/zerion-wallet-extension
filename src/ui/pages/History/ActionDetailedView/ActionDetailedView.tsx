import React, { useMemo } from 'react';
import type { AddressAction } from 'defi-sdk';
import { capitalize } from 'capitalize-ts';
import type { Networks } from 'src/modules/networks/Networks';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { createChain } from 'src/modules/networks/Chain';
import type { ClientTransactionStatus } from 'src/modules/ethereum/transactions/addressAction';
import { useStore } from '@store-unit/react';
import type { LocalAction } from 'src/ui/transactions/local-actions-store';
import {
  LocalActionsStore,
  localActionsStore,
} from 'src/ui/transactions/local-actions-store';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import RetryIcon from 'jsx:src/ui/assets/actions/swap.svg';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { ApprovalInfo, TransferInfo } from './components/TransferInfo';
import { CollectionLine } from './components/CollectionLine';
import { RateLine } from './components/RateLine';
import { SenderReceiverLine } from './components/SenderReceiverLine';
import { FeeLine } from './components/FeeLine';
import { ExplorerInfo } from './components/ExplorerInfo';
import { LocalActionView } from './components/LocalActionView';

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
  action: AddressAction;
  address?: string;
  networks: Networks;
}) {
  const { localActions } = useStore(localActionsStore);
  const chain = useMemo(() => createChain(action.transaction.chain), [action]);

  const actionDate = useMemo(() => {
    return dateFormatter.format(new Date(action.datetime));
  }, [action.datetime]);

  const outgoingTransfers = action.content?.transfers?.outgoing;
  const incomingTransfers = action.content?.transfers?.incoming;

  const isFailed =
    action.transaction.status === 'failed' ||
    (action.transaction.status as ClientTransactionStatus) === 'dropped';

  const hasTransferInfo =
    outgoingTransfers?.length ||
    incomingTransfers?.length ||
    action.content?.single_asset;

  const localAction = localActions[action.transaction.hash] as
    | LocalAction
    | undefined;
  const showLocalAction = isFailed && localAction?.kind === 'swap';

  const swapAgainLink =
    !isFailed && localAction?.kind === 'swap'
      ? LocalActionsStore.getActionLink(localAction)
      : null;

  return (
    <VStack
      gap={14}
      style={{ ['--surface-background-color' as string]: 'var(--white)' }}
    >
      <VStack gap={0} style={{ justifyItems: 'center' }}>
        <UIText
          kind="body/accent"
          color={isFailed ? 'var(--negative-500)' : undefined}
        >
          {`${action.type.display_value}${
            isFailed ? ` (${capitalize(action.transaction.status)})` : ''
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
              actionType={action.type.value}
              singleTransfer={action.content.single_asset}
              address={address}
              chain={chain}
            />
          ) : null}
          {swapAgainLink ? (
            <Button kind="primary" as={UnstyledLink} to={swapAgainLink}>
              <HStack gap={8} alignItems="center">
                <RetryIcon />
                <UIText kind="small/accent">Swap Again</UIText>
              </HStack>
            </Button>
          ) : null}
        </VStack>
      ) : null}
      {showLocalAction ? <LocalActionView localAction={localAction} /> : null}
      <Surface padding={16}>
        <VStack gap={24}>
          <ExplorerInfo action={action} networks={networks} />
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
