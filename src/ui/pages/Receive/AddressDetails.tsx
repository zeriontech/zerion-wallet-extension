import React, { useMemo, useRef } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import {
  getAddressType,
  type BlockchainType,
} from 'src/shared/wallet/classifiers';

function NetworkList({ standard }: { standard: BlockchainType }) {
  const { networks } = useNetworks();
  const allNetworks = useMemo(() => {
    return networks
      ?.getDefaultNetworks(standard)
      .filter((item) => !item.is_testnet && !isCustomNetworkId(item.id));
  }, [networks]);

  return (
    <VStack gap={0}>
      {allNetworks?.map((network) => (
        <HStack key={network.id} gap={12} style={{ paddingBlock: 12 }}>
          <NetworkIcon name={network.name} src={network.icon_url} size={24} />
          <UIText kind="body/regular">{network.name}</UIText>
        </HStack>
      ))}
    </VStack>
  );
}

function EthereumNetworksVisualStack() {
  return (
    <div style={{ display: 'flex' }}>
      <img
        style={{
          width: 20,
          height: 20,
          border: '2px solid var(--white)',
          borderRadius: 6,
          backgroundColor: 'var(--white)',
          marginLeft: -7,
        }}
        src="https://chain-icons.s3.amazonaws.com/optimism.png"
      />
      <img
        style={{
          width: 20,
          height: 20,
          border: '2px solid var(--white)',
          borderRadius: 6,
          backgroundColor: 'var(--white)',
          marginLeft: -7,
        }}
        src="https://chain-icons.s3.amazonaws.com/polygon.png"
      />
      <img
        style={{
          width: 20,
          height: 20,
          border: '2px solid var(--white)',
          borderRadius: 6,
          backgroundColor: 'var(--white)',
          marginLeft: -7,
        }}
        src="https://chain-icons.s3.amazonaws.com/bsc.png"
      />
      <img
        style={{
          width: 20,
          height: 20,
          border: '2px solid var(--white)',
          borderRadius: 6,
          backgroundColor: 'var(--white)',
          marginLeft: -7,
        }}
        src="https://chain-icons.s3.amazonaws.com/chainlist/324"
      />
      <img
        style={{
          width: 20,
          height: 20,
          border: '2px solid var(--white)',
          borderRadius: 6,
          backgroundColor: 'var(--white)',
          marginLeft: -7,
        }}
        src="https://chain-icons.s3.amazonaws.com/base.png"
      />
    </div>
  );
}

function SupportedNetworks({ address }: { address: string }) {
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  const standard = getAddressType(address);

  return (
    <>
      <VStack gap={8} style={{ placeItems: 'center' }}>
        {standard === 'solana' ? (
          <EcosystemSolanaIcon style={{ width: 24, height: 24 }} />
        ) : (
          <HStack gap={6}>
            <EthereumNetworksVisualStack />
            <UIText kind="small/regular" color="var(--neutral-500)">
              +60 more
            </UIText>
          </HStack>
        )}
        <UnstyledButton
          className="hover:underline"
          onClick={() => {
            dialogRef.current?.showModal();
          }}
        >
          <UIText kind="caption/regular">Supported Networks</UIText>
        </UnstyledButton>
      </VStack>
      <BottomSheetDialog
        ref={dialogRef}
        containerStyle={{
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
        renderWhenOpen={() => (
          <>
            <VStack gap={16} style={{ padding: 16 }}>
              <DialogTitle
                alignTitle="start"
                title={<UIText kind="headline/h3">Supported Networks</UIText>}
              />
              <UIText kind="body/regular">
                These are the blockchains Zerion supports for sending,
                receiving, and managing assets.
              </UIText>
              <HStack
                gap={12}
                style={{
                  backgroundColor: 'var(--neutral-100)',
                  paddingBlock: 8,
                  paddingInline: 12,
                  borderRadius: 16,
                }}
                alignItems="center"
              >
                {standard === 'solana' ? (
                  <>
                    <EcosystemEthereumIcon style={{ width: 36, height: 36 }} />
                    <UIText kind="small/regular">
                      To use the Ethereum ecosystem, choose an Ethereum wallet.
                    </UIText>
                  </>
                ) : (
                  <>
                    <EcosystemSolanaIcon style={{ width: 36, height: 36 }} />
                    <UIText kind="small/regular">
                      To use the Solana ecosystem, choose a Solana wallet.
                    </UIText>
                  </>
                )}
              </HStack>
              <NetworkList standard={standard} />
            </VStack>
            <PageStickyFooter
              lineColor="transparent"
              style={{ marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}
            >
              <Button
                kind="primary"
                onClick={() => {
                  dialogRef.current?.close();
                }}
              >
                Got it!
              </Button>
            </PageStickyFooter>
          </>
        )}
      />
    </>
  );
}

export function AddressDetails({
  address,
  domain,
}: {
  address: string;
  domain?: string | null;
}) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  return (
    <VStack gap={24} style={{ justifyItems: 'center' }}>
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 20,
          width: 248,
          height: 248,
          border: '2px solid var(--neutral-200)',
        }}
      >
        <QRCode
          value={address}
          removeQrCodeBehindLogo={true}
          quietZone={24}
          qrStyle="dots"
          eyeRadius={2}
          size={200}
          logoImage="https://s3.amazonaws.com/cdn.zerion.io/assets/logo-icon-128.png"
          logoWidth={36}
          logoHeight={36}
          logoPadding={8}
        />
      </div>
      <SupportedNetworks address={address} />
      <VStack gap={8} style={{ justifyItems: 'center' }}>
        {domain ? <UIText kind="headline/h3">{domain}</UIText> : null}
        <UIText kind="small/regular">
          <b>{address.slice(0, 6)}</b>
          {address.slice(6, -4)}
          <b>{address.slice(-4)}</b>
        </UIText>
      </VStack>
      <Button
        kind="regular"
        size={36}
        style={{ padding: '4px 16px' }}
        onClick={handleCopy}
      >
        {isSuccess ? (
          <HStack gap={12} alignItems="center">
            <CheckIcon
              style={{
                display: 'block',
                width: 20,
                height: 20,
                color: 'var(--positive-500)',
              }}
            />
            <UIText kind="caption/accent">Copied</UIText>
          </HStack>
        ) : (
          <HStack gap={12} alignItems="center">
            <CopyIcon style={{ display: 'block', width: 20, height: 20 }} />
            <UIText kind="caption/accent">Copy Address</UIText>
          </HStack>
        )}
      </Button>
    </VStack>
  );
}
