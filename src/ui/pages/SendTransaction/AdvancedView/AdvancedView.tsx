import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { PageTop } from 'src/ui/components/PageTop';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import type { InterpretResponse } from 'src/modules/ethereum/transactions/types';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { noValueDash } from 'src/ui/shared/typography';
import type { Networks } from 'src/modules/networks/Networks';
import type { Chain } from 'src/modules/networks/Chain';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import type { BigNumberish } from 'ethers';
import { NavigationBar } from '../../SignInWithEthereum/NavigationBar';

function maybeHexValue(value?: BigNumberish): string | null {
  return value ? ethers.utils.hexValue(value) : null;
}

export function TextLine({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <VStack gap={0}>
      <UIText kind="small/regular" color="var(--neutral-500)">
        {label}
      </UIText>
      <Spacer height={4} />
      <UIText kind="body/regular" color="var(--black)">
        {value}
      </UIText>
    </VStack>
  );
}

export function AddressLine({
  networks,
  chain,
  label,
  address,
  padding = 16,
}: {
  networks: Networks;
  chain: Chain;
  label: React.ReactNode;
  address: string;
  padding?: number;
}) {
  return (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <VStack gap={0}>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {label}
        </UIText>
        <Spacer height={4} />
        <UIText kind="body/regular" color="var(--black)" title={address}>
          <TextAnchor
            // Open URL in a new _window_ so that extension UI stays open and visible
            onClick={openInNewWindow}
            href={networks.getExplorerAddressUrlByName(chain, address)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateAddress(address, padding)}
          </TextAnchor>
        </UIText>
      </VStack>
      <ArrowLeftTop />
    </HStack>
  );
}

export function TransactionDetails({
  networks,
  chain,
  transaction,
}: {
  networks: Networks;
  chain: Chain;
  transaction: IncomingTransactionWithChainId;
}) {
  return (
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
        <TextLine label="nonce" value={transaction.nonce || noValueDash} />
        <TextLine
          label="value"
          value={maybeHexValue(transaction.value) || noValueDash}
        />
        <TextLine label="chainId" value={transaction.chainId || noValueDash} />
        <TextLine
          label="gas"
          value={maybeHexValue(transaction.gas) || noValueDash}
        />
        <TextLine
          label="gasLimit"
          value={maybeHexValue(transaction.gasLimit || noValueDash)}
        />
        <TextLine
          label="gasPrice"
          value={maybeHexValue(transaction.gasPrice || noValueDash)}
        />
        <TextLine label="type" value={transaction.type || noValueDash} />

        {/* accessList */}

        <TextLine
          label="maxPriorityFeePerGas"
          value={maybeHexValue(transaction.maxPriorityFeePerGas) || noValueDash}
        />
        <TextLine
          label="maxFeePerGas"
          value={maybeHexValue(transaction.maxFeePerGas) || noValueDash}
        />

        <VStack gap={0}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            data
          </UIText>
          <Spacer height={4} />
          <UIText
            kind="body/regular"
            color="var(--black)"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          >
            {transaction.data ? toUtf8String(transaction.data) : noValueDash}
          </UIText>
        </VStack>
      </VStack>
    </Surface>
  );
}

export function AdvancedView({
  networks,
  chain,
  transaction,
  interpretation,
}: {
  networks: Networks;
  chain: Chain;
  transaction?: IncomingTransactionWithChainId | null;
  interpretation?: InterpretResponse | null;
}) {
  const signature = interpretation?.inputs?.[0]?.schema?.primary_type;
  const functionName = useMemo(() => {
    const match = signature ? signature.match(/(\w+)\(/) : null;
    return match ? match[1] : match;
  }, [signature]);

  return (
    <>
      <NavigationBar title="Advanced View" />
      <PageTop />
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
          <Spacer height={24} />
        </>
      ) : null}
      {transaction ? (
        <TransactionDetails
          networks={networks}
          chain={chain}
          transaction={transaction}
        />
      ) : null}
    </>
  );
}
