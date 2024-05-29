import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { noValueDash } from 'src/ui/shared/typography';
import type { Networks } from 'src/modules/networks/Networks';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import type { Chain } from 'src/modules/networks/Chain';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import type { BigNumberish } from 'ethers';
import type { InterpretResponse } from 'src/modules/ethereum/transactions/types';
import { getInterpretationFunctionName } from 'src/modules/ethereum/transactions/interpret';
import { PageTop } from 'src/ui/components/PageTop';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Button } from 'src/ui/ui-kit/Button';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { valueToHex } from 'src/shared/units/valueToHex';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageBottom } from 'src/ui/components/PageBottom';

function maybeHexValue(value?: BigNumberish): string | null {
  return value ? valueToHex(value) : null;
}

function AddressLine({
  networks,
  chain,
  label,
  address,
}: {
  networks: Networks;
  chain: Chain;
  label: React.ReactNode;
  address: string;
}) {
  const truncatedAddress = truncateAddress(address, 16);
  const explorerUrl = networks.getExplorerAddressUrlByName(chain, address);
  return (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <VStack gap={0}>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {label}
        </UIText>
        <Spacer height={4} />
        <UIText kind="body/regular" color="var(--black)" title={address}>
          {explorerUrl ? (
            <TextAnchor
              // Open URL in a new _window_ so that extension UI stays open and visible
              onClick={openInNewWindow}
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncatedAddress}
            </TextAnchor>
          ) : (
            truncatedAddress
          )}
        </UIText>
      </VStack>
      {explorerUrl ? <ArrowLeftTop /> : null}
    </HStack>
  );
}

export function TransactionDetails({
  networks,
  chain,
  transaction,
  interpretation,
}: {
  networks: Networks;
  chain: Chain;
  transaction: IncomingTransaction;
  interpretation?: InterpretResponse | null;
}) {
  const functionName = useMemo(
    () =>
      interpretation ? getInterpretationFunctionName(interpretation) : null,
    [interpretation]
  );

  const accessList = useMemo(
    () =>
      transaction.accessList
        ? ethers.utils.accessListify(transaction.accessList)
        : null,
    [transaction.accessList]
  );

  return (
    <VStack gap={24}>
      {functionName ? (
        <>
          <Surface padding={16}>
            <UIText kind="small/regular" color="var(--neutral-500)">
              Function
            </UIText>
            <Spacer height={4} />
            <UIText kind="body/accent" color="var(--black)">
              {functionName}
            </UIText>
          </Surface>
        </>
      ) : null}
      <Surface padding={16}>
        <VStack gap={16}>
          {transaction.from ? (
            <AddressLine
              networks={networks}
              chain={chain}
              label="from"
              address={transaction.from}
            />
          ) : (
            <TextLine label="from" value={noValueDash} />
          )}
          {transaction.to ? (
            <AddressLine
              networks={networks}
              chain={chain}
              label="to"
              address={transaction.to}
            />
          ) : (
            <TextLine label="to" value={noValueDash} />
          )}
          <TextLine
            label="nonce"
            value={transaction.nonce ? String(transaction.nonce) : null}
          />
          <TextLine label="value" value={maybeHexValue(transaction.value)} />
          <TextLine label="chainId" value={transaction.chainId} />
          <TextLine label="gas" value={maybeHexValue(transaction.gas)} />
          <TextLine
            label="gasLimit"
            value={maybeHexValue(transaction.gasLimit)}
          />
          <TextLine
            label="gasPrice"
            value={maybeHexValue(transaction.gasPrice)}
          />
          <TextLine label="type" value={transaction.type} />
          <TextLine
            label="maxPriorityFeePerGas"
            value={maybeHexValue(transaction.maxPriorityFeePerGas)}
          />
          <TextLine
            label="maxFeePerGas"
            value={maybeHexValue(transaction.maxFeePerGas)}
          />
          <TextLine
            label="data"
            wrap={true}
            value={
              transaction.data ? toUtf8String(transaction.data) : noValueDash
            }
          />
        </VStack>
      </Surface>
      {accessList && (
        <>
          <Surface padding={16}>
            <VStack gap={16}>
              {accessList.map(({ address, storageKeys }) => (
                <VStack key={address} gap={0}>
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    {address}
                  </UIText>
                  <Spacer height={4} />
                  {storageKeys.map((storageKey) => (
                    <UIText
                      key={storageKey}
                      kind="body/regular"
                      color="var(--black)"
                    >
                      {storageKey}
                    </UIText>
                  ))}
                </VStack>
              ))}
            </VStack>
          </Surface>
        </>
      )}
    </VStack>
  );
}

export function TransactionAdvancedView({
  networks,
  chain,
  transaction,
  interpretation,
}: {
  networks: Networks;
  chain: Chain;
  transaction: IncomingTransaction;
  interpretation?: InterpretResponse | null;
}) {
  const transactionFormatted = useMemo(
    () => JSON.stringify(transaction, null, 2),
    [transaction]
  );

  const { handleCopy: handleCopyRawData, isSuccess: didCopyRawData } =
    useCopyToClipboard({ text: transactionFormatted });

  return (
    <>
      <PageTop />
      {transaction ? (
        <TransactionDetails
          networks={networks}
          chain={chain}
          transaction={transaction}
          interpretation={interpretation}
        />
      ) : null}
      <Spacer height={8} />
      <PageStickyFooter
        style={{
          marginInline: 'calc(-1 * var(--column-padding-inline))',
        }}
      >
        <Spacer height={8} />
        <Button
          type="button"
          kind="primary"
          size={44}
          style={{ padding: '10px 20px' }}
          onClick={handleCopyRawData}
        >
          <HStack gap={12} alignItems="center" justifyContent="center">
            <UIText kind="body/accent">
              {didCopyRawData ? 'Copied' : 'Copy Raw Data'}
            </UIText>
            {React.createElement(didCopyRawData ? CheckIcon : CopyIcon, {
              display: 'block',
              width: 24,
              height: 24,
            })}
          </HStack>
        </Button>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}
