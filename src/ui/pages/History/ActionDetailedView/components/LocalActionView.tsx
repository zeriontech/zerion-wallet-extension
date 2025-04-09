import React, { useMemo } from 'react';
import type { ActionTransfers } from 'defi-sdk';
import { useAssetsPrices } from 'defi-sdk';
import { useStore } from '@store-unit/react';
import type { SwapLocalAction } from 'src/ui/transactions/local-actions-store';
import {
  localActionsStore,
  LocalActionsStore,
  type LocalAction,
} from 'src/ui/transactions/local-actions-store';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import RetryIcon from 'jsx:src/ui/assets/actions/swap.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { createChain } from 'src/modules/networks/Chain';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { commonToBase } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import type { ClientTransactionStatus } from 'src/modules/ethereum/transactions/addressAction';
import { TransferInfo } from './TransferInfo';

function SwapLocalActionView({
  localAction,
  showTransferInfo,
  status,
}: {
  localAction: SwapLocalAction;
  showTransferInfo?: boolean;
  status: ClientTransactionStatus;
}) {
  const link = LocalActionsStore.getActionLink(localAction);
  const chain = createChain(localAction.chain);
  const { currency } = useCurrency();
  const { value, isLoading } = useAssetsPrices({
    asset_codes: [localAction.spendTokenId, localAction.receiveTokenId],
    currency,
  });

  const transfers = useMemo<ActionTransfers>(() => {
    const spendToken = value?.[localAction.spendTokenId];
    const receiveToken = value?.[localAction.receiveTokenId];
    return {
      incoming: receiveToken
        ? [
            {
              asset: { fungible: receiveToken },
              quantity: commonToBase(
                localAction.receiveInput,
                getDecimals({ asset: receiveToken, chain })
              ).toFixed(),
              price: receiveToken.price?.value || null,
            },
          ]
        : [],
      outgoing: spendToken
        ? [
            {
              asset: { fungible: spendToken },
              quantity: commonToBase(
                localAction.spendInput,
                getDecimals({ asset: spendToken, chain })
              ).toFixed(),
              price: spendToken.price?.value || null,
            },
          ]
        : [],
    };
  }, [value, chain, localAction]);

  const isFailed = status === 'failed' || status === 'dropped';

  if (isLoading) {
    return null;
  }

  return (
    <VStack gap={12}>
      {showTransferInfo ? (
        <VStack gap={4}>
          {transfers.outgoing ? (
            <TransferInfo
              chain={chain}
              direction="outgoing"
              title="Send"
              transfers={transfers.outgoing}
            />
          ) : null}
          {transfers.incoming ? (
            <TransferInfo
              chain={chain}
              direction="incoming"
              title="Receive"
              transfers={transfers.incoming}
            />
          ) : null}
        </VStack>
      ) : null}
      {link ? (
        <Button kind="primary" as={UnstyledLink} to={link}>
          <HStack gap={8} alignItems="center">
            <RetryIcon />
            <UIText kind="small/accent">
              {isFailed ? 'Try Again' : 'Swap Again'}
            </UIText>
          </HStack>
        </Button>
      ) : null}
    </VStack>
  );
}

export function LocalActionView({
  localActionKey,
  showTransferInfo,
  status,
}: {
  localActionKey: string;
  showTransferInfo?: boolean;
  status: ClientTransactionStatus;
}) {
  const { localActions } = useStore(localActionsStore);

  const localAction = localActions[localActionKey] as LocalAction | undefined;

  if (localAction?.kind === 'swap') {
    return (
      <SwapLocalActionView
        localAction={localAction}
        status={status}
        showTransferInfo={showTransferInfo}
      />
    );
  }
  return null;
}
