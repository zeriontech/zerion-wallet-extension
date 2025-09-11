import React, { useMemo } from 'react';
import { accessListify } from 'ethers';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { noValueDash } from 'src/ui/shared/typography';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import type { BigNumberish } from 'ethers';
// import { getInterpretationFunctionName } from 'src/modules/ethereum/transactions/interpret';
import { PageTop } from 'src/ui/components/PageTop';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Button } from 'src/ui/ui-kit/Button';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { valueToHex } from 'src/shared/units/valueToHex';
import { ApplicationLine } from 'src/ui/components/address-action/ApplicationLine';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { PageBottom } from 'src/ui/components/PageBottom';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';
import { RecipientLine } from 'src/ui/components/address-action/RecipientLine';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';

function maybeHexValue(value?: BigNumberish | null): string | null {
  return value ? valueToHex(value) : null;
}

function AddressLine({
  network,
  label,
  address,
}: {
  network: NetworkConfig;
  label: React.ReactNode;
  address: string;
}) {
  const truncatedAddress = truncateAddress(address, 16);
  const explorerUrl = Networks.getExplorerAddressUrl(network, address);

  return (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <VStack gap={0}>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {label}
        </UIText>
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

function TransactionDetails({
  network,
  transaction,
}: // interpretation,
{
  network: NetworkConfig;
  transaction: IncomingTransaction;
  interpretation?: InterpretResponse | null;
}) {
  // const functionName = useMemo(
  //   () =>
  //     interpretation ? getInterpretationFunctionName(interpretation) : null,
  //   [interpretation]
  // );

  const accessList = useMemo(
    () =>
      transaction.accessList ? accessListify(transaction.accessList) : null,
    [transaction.accessList]
  );

  return (
    <VStack gap={8}>
      {/* {functionName ? (
        <>
          <Surface padding={16}>
            <UIText kind="small/regular" color="var(--neutral-500)">
              Function
            </UIText>
            <UIText kind="body/accent" color="var(--black)">
              {functionName}
            </UIText>
          </Surface>
        </>
      ) : null} */}
      <Surface padding={16}>
        <VStack gap={16}>
          {transaction.from ? (
            <AddressLine
              network={network}
              label="from"
              address={transaction.from}
            />
          ) : (
            <TextLine label="from" value={noValueDash} />
          )}
          {transaction.to ? (
            <AddressLine
              network={network}
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
          <TextLine
            label="chainId"
            value={
              transaction.chainId == null ? null : String(transaction.chainId)
            }
          />
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
  network,
  transaction,
  interpretation,
  addressAction,
  onCopyData,
}: {
  network: NetworkConfig;
  transaction: MultichainTransaction;
  interpretation?: InterpretResponse | null;
  addressAction: AnyAddressAction;
  onCopyData?: () => void;
}) {
  const transactionFormatted = useMemo(() => {
    if (transaction.evm) {
      return JSON.stringify(transaction.evm, null, 2);
    } else {
      return transaction.solana;
    }
  }, [transaction]);

  const { handleCopy } = useCopyToClipboard({
    text: transactionFormatted,
    onSuccess: onCopyData,
  });

  return (
    <>
      <PageTop />
      <VStack
        gap={8}
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {addressAction.label?.wallet ? (
          <RecipientLine
            recipientAddress={addressAction.label.wallet.address}
            recipientName={addressAction.label.wallet.name || null}
            network={network}
            showNetworkIcon={true}
          />
        ) : null}
        {addressAction.label?.contract ? (
          <ApplicationLine addressAction={addressAction} network={network} />
        ) : null}
        {transaction.evm ? (
          <TransactionDetails
            network={network}
            transaction={transaction.evm}
            interpretation={interpretation}
          />
        ) : (
          <Surface style={{ padding: 12, overflowWrap: 'break-word' }}>
            {transaction.solana}
          </Surface>
        )}
      </VStack>
      <Spacer height={24} />
      <form
        method="dialog"
        onSubmit={(event) => event.stopPropagation()}
        style={{ marginTop: 'auto' }}
      >
        <Button
          value={DialogButtonValue.cancel}
          kind="primary"
          style={{ width: '100%' }}
          onClick={handleCopy}
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            <span>Copy Raw Data</span>
            <CopyIcon />
          </HStack>
        </Button>
      </form>
      <PageBottom />
    </>
  );
}
