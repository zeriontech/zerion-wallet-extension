import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { noValueDash } from 'src/ui/shared/typography';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { NonceDialogForm } from 'src/ui/pages/SendTransaction/NonceLine/NonceLine';
import * as styles from './QuoteDetails.module.css';

enum NonceSource {
  user,
  transaction,
  blockchain,
}

function getNonceSourceTitle(source: NonceSource, rpcUrl: string | null) {
  const types = {
    [NonceSource.user]: 'Custom Nonce',
    [NonceSource.transaction]: 'Incoming Transaction',
    [NonceSource.blockchain]: `${rpcUrl || 'Blockchain'}`,
  };
  return `Source: ${types[source]}. Click to configure`;
}

export function NonceLine2({
  transaction,
  chain,
  userNonce,
  onChange,
}: {
  transaction: PartiallyRequired<
    Pick<IncomingTransaction, 'from' | 'nonce'>,
    'from'
  >;
  chain: Chain;
  userNonce: string | null;
  onChange: (nonce: string | null) => void;
}) {
  const { from } = transaction;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['getTransactionCount', from, chain],
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const network = await networksStore.fetchNetworkById(chain.toString());
      return uiGetBestKnownTransactionCount({
        address: from,
        network,
        defaultBlock: 'pending',
      });
    },
    useErrorBoundary: false,
    suspense: true,
  });
  const dialog = useDialog2();
  const nonce = data?.value;
  const value = userNonce ?? transaction.nonce ?? nonce;
  const displayValue = value != null ? parseInt(String(value)) : noValueDash;
  const source =
    userNonce != null
      ? NonceSource.user
      : transaction.nonce != null
      ? NonceSource.transaction
      : NonceSource.blockchain;
  const sourceTitle = getNonceSourceTitle(source, data?.source || null);

  return (
    <>
      <UnstyledButton
        type="button"
        title={sourceTitle}
        className={styles.detailLinkRow}
        onClick={dialog.openDialog}
      >
        <HStack gap={8} justifyContent="space-between" alignItems="center">
          <UIText kind="small/regular">Nonce</UIText>
          <HStack gap={4} alignItems="center">
            <UIText kind="small/accent">
              {isError ? (
                'Unable to get nonce'
              ) : isLoading ? (
                <DelayedRender>{displayValue}</DelayedRender>
              ) : (
                displayValue
              )}
            </UIText>
            <ChevronRightIcon className={styles.detailLinkChevron} />
          </HStack>
        </HStack>
      </UnstyledButton>
      <Dialog2
        open={dialog.open}
        onClose={dialog.closeDialog}
        title="Nonce"
        size="content"
      >
        <div style={{ padding: 16, paddingTop: 0 }}>
          <NonceDialogForm
            defaultValue={userNonce ? String(parseInt(userNonce)) : ''}
            placeholder={
              nonce != null ? String(transaction.nonce || nonce) : ''
            }
            onSubmit={(nonce) => {
              dialog.closeDialog();
              onChange(nonce);
            }}
          />
        </div>
      </Dialog2>
    </>
  );
}
