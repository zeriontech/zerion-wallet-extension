import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'ethers';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isDeviceAccount, isHardwareContainer } from 'src/shared/types/validators';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { getBaseAssetDecimals } from 'src/modules/networks/NetworkInfo';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import {
  decodeSafeTx,
  type DecodedSafeTx,
  type SafeTxCall,
} from 'src/modules/ethereum/message-signing/decodeSafeTx';
import { CopyButton } from 'src/ui/components/CopyButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';

export const SAFE_APP_ORIGIN = 'https://app.safe.global';

/**
 * Ledger's USB vendor id. WebUSB always exposes it; Web Bluetooth does not, so
 * a Ledger imported over Bluetooth has no `vendorId` on its container.
 */
const LEDGER_VENDOR_ID = 0x2c97;

const MONO_STYLE: React.CSSProperties = {
  fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  wordBreak: 'break-all',
};

function isLedgerHardwareGroup(group: WalletGroup | null | undefined): boolean {
  if (!group) {
    return false;
  }
  const container = group.walletContainer;
  if (!isHardwareContainer(container)) {
    return false;
  }
  // `provider` is written only by the Ledger import flow. Never label another
  // hardware wallet as Ledger: a known foreign vendor id hides the section.
  if (container.provider !== 'ledger') {
    return false;
  }
  const vendorId = container.device.vendorId;
  return vendorId == null || vendorId === LEDGER_VENDOR_ID;
}

/**
 * The page only receives the public wallet fields, so the account container is
 * resolved through the store to confirm the device vendor. Non-device signers
 * issue no request at all.
 */
function useIsLedgerSigner(wallet: ExternallyOwnedAccount): boolean {
  const isDevice = isDeviceAccount(wallet);
  const { data: group } = useQuery({
    queryKey: ['getWalletGroupByAddress', wallet.address],
    queryFn: () => getWalletGroupByAddress(wallet.address),
    enabled: isDevice,
    staleTime: Infinity,
    suspense: false,
  });
  return isDevice && isLedgerHardwareGroup(group);
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <HStack gap={12} justifyContent="space-between" alignItems="start">
      <UIText kind="caption/regular" color="var(--neutral-500)" style={{ flexShrink: 0 }}>
        {label}
      </UIText>
      <UIText
        kind="caption/regular"
        style={{ textAlign: 'end', ...(mono ? MONO_STYLE : undefined) }}
      >
        {value}
      </UIText>
    </HStack>
  );
}

function HashRow({ label, hash }: { label: string; hash: string }) {
  return (
    <HStack gap={8} justifyContent="space-between" alignItems="start">
      <VStack gap={2} style={{ minWidth: 0 }}>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {label}
        </UIText>
        <UIText kind="caption/regular" style={MONO_STYLE}>
          {hash}
        </UIText>
      </VStack>
      <CopyButton textToCopy={hash} title={`Copy ${label}`} />
    </HStack>
  );
}

function CallRow({
  call,
  decoded,
  network,
}: {
  call: SafeTxCall;
  decoded: DecodedSafeTx;
  network: NetworkInfo;
}) {
  if (call.kind === 'native') {
    const decimals = getBaseAssetDecimals(network);
    const symbol = network.baseAsset?.symbol;
    const amount = decimals == null ? call.value.toString() : formatUnits(call.value, decimals);
    return (
      <VStack gap={4}>
        <UIText kind="body/accent">Native transfer</UIText>
        <DetailRow label="Amount" value={`${amount}${symbol ? ` ${symbol}` : ''}`} />
        <DetailRow label="To" value={call.to} mono />
      </VStack>
    );
  }

  if (call.kind === 'erc20-transfer') {
    return (
      <VStack gap={4}>
        <UIText kind="body/accent">Token transfer</UIText>
        <DetailRow label="Token" value={call.to} mono />
        <DetailRow label="Amount" value={call.amount?.toString() ?? ''} />
        <DetailRow label="Recipient" value={call.recipient ?? ''} mono />
      </VStack>
    );
  }

  const title =
    call.kind === 'contract-call'
      ? 'Contract call'
      : call.kind === 'inner-delegatecall'
        ? 'Delegatecall inside batch'
        : decoded.batch?.knownMultiSendCallOnly && call.value === 0n
          ? 'Batch, not decoded'
          : 'Delegatecall to an unknown contract, not decoded';

  return (
    <VStack gap={4}>
      <UIText kind="body/accent">{title}</UIText>
      <DetailRow label="To" value={call.to} mono />
      <DetailRow label="Value" value={call.value.toString()} />
      <DetailRow label="Data" value={call.data} mono />
    </VStack>
  );
}

function RefundSection({ refund }: { refund: NonNullable<DecodedSafeTx['refund']> }) {
  return (
    <VStack gap={4}>
      <UIText kind="body/accent">Refund</UIText>
      {refund.gasPrice !== 0n ? (
        <DetailRow label="Gas price" value={refund.gasPrice.toString()} />
      ) : null}
      {refund.safeTxGas !== 0n ? (
        <DetailRow label="Safe tx gas" value={refund.safeTxGas.toString()} />
      ) : null}
      {refund.baseGas !== 0n ? (
        <DetailRow label="Base gas" value={refund.baseGas.toString()} />
      ) : null}
      {refund.gasToken.toLowerCase() !== '0x0000000000000000000000000000000000000000' ? (
        <DetailRow label="Gas token" value={refund.gasToken} mono />
      ) : null}
      {refund.refundReceiver.toLowerCase() !== '0x0000000000000000000000000000000000000000' ? (
        <DetailRow label="Refund receiver" value={refund.refundReceiver} mono />
      ) : null}
    </VStack>
  );
}

/**
 * The SafeTx details a Ledger owner can compare against the device: the Safe,
 * nonce, every decoded call, the refund and the three EIP-712 hashes. The
 * network is shown here only when the page-level network row cannot show it.
 * It is display-only and independent of the simulation: a canonical SafeTx
 * always renders it, and signing stays enabled.
 */
export function SafeTxDetails({
  origin,
  wallet,
  typedData,
  network,
  showNetwork,
}: {
  origin: string;
  wallet: ExternallyOwnedAccount;
  typedData: TypedData;
  network: NetworkInfo;
  /** Whether the page already renders the resolved network name and icon. */
  showNetwork: boolean;
}) {
  const decoded = useMemo(
    () => (origin === SAFE_APP_ORIGIN ? decodeSafeTx(typedData) : null),
    [origin, typedData],
  );
  const isLedgerSigner = useIsLedgerSigner(wallet);

  if (!decoded || !isLedgerSigner) {
    return null;
  }

  // The page resolves a canonical SafeTx to its domain chain; when that chain
  // is not in the wallet's list it falls back to the origin chain, so never
  // label a different network as the transaction's.
  const networkLabel =
    network.specification?.eip155?.chainId === decoded.chainId
      ? network.name
      : `Chain ${decoded.chainId}`;

  return (
    <Surface padding={16} style={{ backgroundColor: 'var(--neutral-100)' }}>
      <VStack gap={12}>
        <UIText kind="body/accent">Safe transaction details</UIText>
        <VStack gap={4}>
          <DetailRow label="Safe" value={decoded.safe} mono />
          {showNetwork ? null : <DetailRow label="Network" value={networkLabel} />}
          <DetailRow label="Nonce" value={decoded.nonce.toString()} />
        </VStack>
        <VStack gap={12}>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Calls
          </UIText>
          {decoded.calls.map((call, index) => (
            <CallRow key={index} call={call} decoded={decoded} network={network} />
          ))}
        </VStack>
        {decoded.refund ? <RefundSection refund={decoded.refund} /> : null}
        <VStack gap={8}>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Hashes
          </UIText>
          <HashRow label="SafeTx hash" hash={decoded.hashes.safeTxHash} />
          <HashRow label="Domain hash" hash={decoded.hashes.domainHash} />
          <HashRow label="Message hash" hash={decoded.hashes.messageHash} />
        </VStack>
      </VStack>
    </Surface>
  );
}
