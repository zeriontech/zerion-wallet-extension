import type { ethers } from 'ethers';
import React from 'react';
import { useQuery } from 'react-query';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

function PendingTransaction({
  transaction: tx,
}: {
  transaction: ethers.providers.TransactionResponse;
}) {
  const { isLoading } = useQuery(tx.hash, () => tx.wait?.(1));
  return (
    <UIText kind="body/s_reg">
      <HStack gap={8}>
        {isLoading ? <span>...</span> : null}
        <span title={tx.hash}>{truncateAddress(tx.hash, 6)}</span>
      </HStack>
    </UIText>
  );
}

export function History() {
  const { data, ...pendingTransactionsQuery } = useQuery(
    'wallet/history',
    () => walletPort.request('getPendingTransactions'),
    { useErrorBoundary: true }
  );
  if (pendingTransactionsQuery.isLoading) {
    return null;
  }
  return (
    <Background backgroundColor="var(--background)">
      <PageColumn>
        {data?.length ? (
          <>
            <PageTop />
            <UIText kind="h/5_reg">
              <ul>
                {data.map((tx) => (
                  <li key={tx.hash}>
                    <PendingTransaction transaction={tx} />
                  </li>
                ))}
              </ul>
            </UIText>
          </>
        ) : (
          <FillView>
            <UIText kind="h/5_reg" color="var(--neutral-500)">
              Empty State
            </UIText>
          </FillView>
        )}
      </PageColumn>
    </Background>
  );
}
