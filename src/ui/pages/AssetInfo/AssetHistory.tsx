import { useAddressActions } from 'defi-sdk';
import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function AssetHistory({
  assetId,
  asset,
}: {
  assetId: string;
  asset?: Asset;
}) {
  const { singleAddressNormalized, ready } = useAddressParams();
  const { currency } = useCurrency();
  const {
    value,
    isFetching: actionsAreLoading,
    hasNext,
    fetchMore,
  } = useAddressActions(
    {
      address: singleAddressNormalized,
      currency,
      actions_fungible_ids: [assetId],
    },
    {
      limit: 10,
      listenForUpdates: true,
      paginatedCacheMode: 'first-page',
      enabled: ready,
    }
  );

  if (!value?.length) {
    return null;
  }

  return (
    <VStack gap={8}>
      <VStack gap={4}>
        <UIText kind="headline/h3">History</UIText>
        <VStack gap={0}></VStack>
      </VStack>
      {hasNext ? (
        <Button
          kind="neutral"
          onClick={fetchMore}
          disabled={actionsAreLoading}
          style={{
            ['--button-background' as string]: 'var(--neutral-200)',
            ['--button-background-hover' as string]: 'var(--neutral-300)',
          }}
        >
          More Transactions
        </Button>
      ) : null}
    </VStack>
  );
}
