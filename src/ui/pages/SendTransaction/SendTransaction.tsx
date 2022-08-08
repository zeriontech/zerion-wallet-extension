import React, { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { DataStatus, useAssetsPrices } from 'defi-sdk';
import { ethers, UnsignedTransaction } from 'ethers';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Surface } from 'src/ui/ui-kit/Surface';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Media } from 'src/ui/ui-kit/Media';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { NetworkIndicator } from 'src/ui/components/NetworkIndicator';
import { useNetworks } from 'src/modules/networks/useNetworks';
import {
  describeTransaction,
  TransactionAction,
  TransactionDescription as TransactionDescriptionType,
} from 'src/modules/ethereum/transactions/describeTransaction';
import { baseToCommon } from 'src/shared/units/convert';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { Twinkle } from 'src/ui/ui-kit/Twinkle';
import ZerionSquircle from 'src/ui/assets/zerion-squircle.svg';
import { strings } from 'src/ui/transactions/strings';
import type { BareWallet } from 'src/shared/types/BareWallet';

function ItemSurface({ style, ...props }: React.HTMLProps<HTMLDivElement>) {
  const surfaceStyle = {
    ...style,
    padding: '10px 12px',
    backgroundColor: 'var(--background)',
  };
  return <Surface style={surfaceStyle} {...props} />;
}

function WalletLine({ address, label }: { address: string; label: string }) {
  return (
    <ItemSurface>
      <Media
        vGap={0}
        image={<BlockieImg address={address} size={32} />}
        text={
          <UIText kind="caption/reg" color="var(--neutral-500)">
            {label}
          </UIText>
        }
        detailText={
          <UIText kind="subtitle/l_reg">{truncateAddress(address, 4)}</UIText>
        }
      />
    </ItemSurface>
  );
}

function AssetLine({
  transaction,
}: {
  transaction: TransactionDescriptionType;
}) {
  const assetCode =
    transaction.sendAssetId ||
    transaction.approveAssetCode ||
    transaction.sendAssetCode;
  const { value: assets, status } = useAssetsPrices(
    { currency: 'usd', asset_codes: [assetCode?.toLowerCase() || ''] },
    { enabled: Boolean(assetCode) }
  );
  const asset = assetCode ? assets?.[assetCode] : null;
  if (
    status === DataStatus.ok &&
    !asset &&
    assetCode &&
    (transaction.action === TransactionAction.transfer ||
      transaction.action === TransactionAction.approve)
  ) {
    // Couldn't resolve asset for a send or approve transaction
    return (
      <ItemSurface>
        <Media
          vGap={0}
          image={null}
          text={
            <UIText kind="caption/reg" color="var(--neutral-500)">
              Token (link to explorer?)
            </UIText>
          }
          detailText={
            <UIText kind="subtitle/l_reg" title={assetCode}>
              {truncateAddress(assetCode, 6)}
            </UIText>
          }
        />
      </ItemSurface>
    );
  }
  if (!asset) {
    return status === DataStatus.requested ? (
      <ItemSurface style={{ height: 56 }} />
    ) : null;
  }
  if (transaction.action === TransactionAction.approve) {
    return (
      <ItemSurface>
        <Media
          vGap={0}
          image={
            <img
              style={{ width: 32, height: 32, borderRadius: '50%' }}
              src={asset.icon_url || ''}
            />
          }
          text={
            <UIText kind="caption/reg" color="var(--neutral-500)">
              Token
            </UIText>
          }
          detailText={
            <UIText kind="subtitle/l_reg">{asset.symbol || '...'}</UIText>
          }
        />
      </ItemSurface>
    );
  }
  if (transaction.action === TransactionAction.transfer) {
    return (
      <ItemSurface>
        <Media
          vGap={0}
          image={
            <img
              style={{ width: 32, height: 32, borderRadius: '50%' }}
              src={asset.icon_url || '...'}
            />
          }
          text={
            <UIText kind="caption/reg" color="var(--neutral-500)">
              Amount
            </UIText>
          }
          detailText={
            transaction.sendAmount == null ? null : (
              <UIText kind="subtitle/l_reg">
                {`${formatTokenValue(
                  baseToCommon(transaction.sendAmount, 18)
                )} ${asset.symbol}`}
              </UIText>
            )
          }
        />
      </ItemSurface>
    );
  }
  return null;
}

function TransactionDescription({
  transactionDescription,
}: {
  transactionDescription: TransactionDescriptionType;
}) {
  const { action, contractAddress, assetReceiver } = transactionDescription;
  return (
    <>
      <AssetLine transaction={transactionDescription} />
      {action === TransactionAction.transfer && assetReceiver ? (
        <WalletLine address={assetReceiver} label="Receiver" />
      ) : null}
      {action === TransactionAction.contractInteraction && contractAddress ? (
        <ItemSurface>
          <Media
            image={null}
            text={
              <UIText kind="caption/reg" color="var(--neutral-500)">
                Contract Address
              </UIText>
            }
            detailText={
              <UIText kind="subtitle/l_reg" title="contractAddress">
                {truncateAddress(contractAddress, 10)}
              </UIText>
            }
          />
        </ItemSurface>
      ) : null}
    </>
  );
}

function SendTransactionContent({
  transactionStringified,
  origin,
  wallet,
}: {
  transactionStringified: string;
  origin: string;
  wallet: BareWallet;
}) {
  const [params] = useSearchParams();
  const transaction = useMemo(
    () => JSON.parse(transactionStringified) as UnsignedTransaction,
    [transactionStringified]
  );
  const descriptionQuery = useQuery(
    ['description', transaction],
    () => describeTransaction(transaction),
    {
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const { networks } = useNetworks();
  const { mutate: signAndSendTransaction, ...signMutation } = useMutation(
    async (transaction: UnsignedTransaction) => {
      await new Promise((r) => setTimeout(r, 1000));
      return await walletPort.request('signAndSendTransaction', [transaction]);
    },
    {
      onSuccess: ({ hash }) => {
        windowPort.confirm(Number(params.get('windowId')), hash);
      },
    }
  );
  const originName = useMemo(() => new URL(origin).hostname, [origin]);
  if (descriptionQuery.isLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Twinkle>
          <ZerionSquircle style={{ width: 64, height: 64 }} />
        </Twinkle>
      </div>
    );
  }
  if (descriptionQuery.isError || !descriptionQuery.data) {
    throw descriptionQuery.error || new Error('testing');
  }
  return (
    <PageColumn>
      <PageTop />
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <ZerionSquircle style={{ width: 44, height: 44 }} />
        <Spacer height={16} />
        <UIText kind="h/5_med" style={{ textAlign: 'center' }}>
          {strings.actions[descriptionQuery.data.action] ||
            strings.actions[TransactionAction.contractInteraction]}
        </UIText>
        <Spacer height={8} />
        <UIText kind="subtitle/m_reg" color="var(--primary)">
          {originName}
        </UIText>
        <Spacer height={8} />
        <NetworkIndicator chainId={transaction.chainId} />
        <Spacer height={8} />
        <UIText kind="subtitle/m_reg">
          <i>
            {
              networks?.getEthereumChainParameter(
                ethers.utils.hexValue(transaction.chainId || 1)
              ).rpcUrls[0]
            }
          </i>
        </UIText>
      </div>
      <Spacer height={24} />
      <Spacer height={16} />
      <VStack gap={12}>
        <WalletLine address={wallet.address} label="Wallet" />
        <TransactionDescription
          transactionDescription={descriptionQuery.data}
        />
      </VStack>
      <Spacer height={16} />

      <VStack
        style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: 32 }}
        gap={8}
      >
        <UIText kind="body/s_reg" color="var(--negative)">
          {signMutation.isError
            ? (signMutation.error as Error)?.message || 'Some Error'
            : null}
        </UIText>
        <Button
          onClick={() => {
            signAndSendTransaction(transaction);
          }}
        >
          {signMutation.isLoading
            ? 'Sending...'
            : descriptionQuery.data.action === TransactionAction.approve
            ? 'Approve'
            : 'Confirm'}
        </Button>
        <UnstyledButton
          style={{ color: 'var(--primary)' }}
          onClick={() => {
            windowPort.reject(Number(params.get('windowId')));
          }}
        >
          Reject
        </UnstyledButton>
      </VStack>
    </PageColumn>
  );
}

export function SendTransaction() {
  const [params] = useSearchParams();
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet', () => {
    return walletPort.request('getCurrentWallet');
  });
  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet) {
    return null;
  }
  const origin = params.get('origin');
  if (!origin) {
    throw new Error('origin get-parameter is required for this view');
  }
  const transactionStringified = params.get('transaction');
  if (!transactionStringified) {
    throw new Error('transaction get-parameter is required for this view');
  }
  return (
    <SendTransactionContent
      transactionStringified={transactionStringified}
      origin={origin}
      wallet={wallet}
    />
  );
}
