import { ethers } from 'ethers';
import React, { useId, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransactionCount } from 'src/modules/ethereum/transactions/getTransactionCount';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { noValueDash } from 'src/ui/shared/typography';
import { InnerLabelInput } from 'src/ui/ui-kit/Input/InnerLabelInput';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { collectData } from 'src/ui/shared/form-data';
import { DelayedRender } from 'src/ui/components/DelayedRender';

function parseNonce(untypedValue: unknown) {
  const value = untypedValue as string;
  if (!value) {
    return null;
  } else if (value.startsWith('0x')) {
    return ethers.utils.hexValue(value);
  } else {
    return ethers.utils.hexValue(Number(value));
  }
}

function NonceDialogForm({
  defaultValue,
  placeholder,
  onSubmit,
}: {
  defaultValue: string;
  placeholder: string;
  onSubmit: (nonce: string | null) => void;
}) {
  const id = useId();
  return (
    <form
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          return;
        }
        const formData = collectData(form, { nonce: parseNonce });
        const nonce = formData.nonce as string;
        onSubmit(nonce);
      }}
    >
      <VStack gap={16}>
        <UIText kind="body/regular">Advanced Feature: Use with Caution</UIText>
        <InnerLabelInput
          id={id}
          label="Nonce"
          name="nonce"
          defaultValue={defaultValue}
          placeholder={placeholder}
          inputMode="numeric"
          pattern="^0x[\dabcdef]+|\d+"
          onInvalid={(event) =>
            event.currentTarget.setCustomValidity(
              'Nonce must be either a 0x-prefixed hex value or an integer'
            )
          }
          onInput={(event) => event.currentTarget.setCustomValidity('')}
        />
      </VStack>
      <HStack
        gap={8}
        style={{
          position: 'sticky',
          bottom: 0,
          marginTop: 'auto',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <Button
          kind="regular"
          onClick={(event) => {
            event?.currentTarget?.form?.reset();
            onSubmit(null);
          }}
          type="button"
        >
          Reset
        </Button>
        <Button kind="primary">Save</Button>
      </HStack>
    </form>
  );
}

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
  if (source in types === false) {
    throw new Error('Invalid NonceSource value');
  }
  const type = types[source];
  return `Source: ${type}. Click to configure`;
}

export function NonceLine({
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
  const { networks } = useNetworks();
  const { from } = transaction;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['getTransactionCount', networks, from, chain],
    queryFn: async () => {
      if (!networks) {
        return;
      }
      return getTransactionCount({
        address: from,
        chain,
        networks,
        defaultBlock: 'pending',
      });
    },
    useErrorBoundary: false,
    enabled: Boolean(networks),
    suspense: true,
  });
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const nonce = data?.value;
  const value = userNonce ?? transaction.nonce ?? nonce;
  const displayValue = value ? parseInt(String(value)) : noValueDash;
  const source =
    userNonce != null
      ? NonceSource.user
      : transaction.nonce != null
      ? NonceSource.transaction
      : NonceSource.blockchain;
  const sourceTitle = getNonceSourceTitle(source, data?.source || null);
  return (
    <>
      <BottomSheetDialog ref={dialogRef} height="90vh">
        <NonceDialogForm
          defaultValue={userNonce ? String(parseInt(userNonce)) : ''}
          placeholder={nonce ? String(parseInt(nonce)) : ''}
          onSubmit={(nonce) => {
            dialogRef.current?.close();
            onChange(nonce);
          }}
        />
      </BottomSheetDialog>

      <HStack gap={8} justifyContent="space-between">
        <UIText kind="small/regular" color="var(--neutral-700)">
          Nonce
        </UIText>
        <UnstyledButton
          type="button"
          title={sourceTitle}
          className={helperStyles.hoverUnderline}
          style={{ color: 'var(--primary)' }}
          onClick={() => {
            dialogRef.current?.showModal();
          }}
        >
          <UIText kind="small/accent">
            {isError ? (
              'Unable to get nonce'
            ) : isLoading ? (
              <DelayedRender>{displayValue}</DelayedRender>
            ) : (
              displayValue
            )}
          </UIText>
        </UnstyledButton>
      </HStack>
    </>
  );
}
