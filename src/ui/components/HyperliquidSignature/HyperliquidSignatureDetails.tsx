import React from 'react';
import { Frame } from 'src/ui/ui-kit/Frame';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import type { HyperliquidSignatureSummary } from 'src/modules/hyperliquid/security/hyperliquidTypedData';
import { formatHyperliquidFeePercent } from 'src/modules/hyperliquid/security/hyperliquidTypedData';

const HYPERLIQUID_ACTION_LABEL: Record<HyperliquidSignatureSummary['kind'], string> = {
  approveAgent: 'Enable trading',
  approveBuilderFee: 'Approve builder fee',
  withdraw: 'Withdraw from Hyperliquid',
  usdSend: 'Send USDC',
  spotSend: 'Send spot token',
  setReferrer: 'Set referral code',
  userSetAbstraction: 'Change account mode',
  l1Action: 'Hyperliquid action',
  unknown: 'Unrecognized Hyperliquid action',
};

export function getHyperliquidActionLabel(summary: HyperliquidSignatureSummary): string {
  return HYPERLIQUID_ACTION_LABEL[summary.kind];
}

function abbreviateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function builderLabel(
  builder: string | undefined,
  knownBuilders: Record<string, string> | undefined,
): string {
  if (!builder) return 'Unknown';
  const known = knownBuilders?.[builder.toLowerCase()];
  return known ?? `Unknown (${abbreviateAddress(builder)})`;
}

function getDescription(
  summary: HyperliquidSignatureSummary,
  knownBuilders: Record<string, string> | undefined,
): string {
  switch (summary.kind) {
    case 'approveAgent':
      return 'Enables a trading session for this site: it can place and cancel Hyperliquid orders for you. It cannot withdraw funds.';
    case 'approveBuilderFee':
      return `Lets ${builderLabel(summary.builder, knownBuilders)} charge up to ${formatHyperliquidFeePercent(
        summary.feePercent,
      )} on every Hyperliquid trade you make from this account.`;
    case 'withdraw':
      return `Withdraws ${summary.amount ?? 'an amount'} USDC from your Hyperliquid account to ${
        summary.destination ? abbreviateAddress(summary.destination) : 'a destination address'
      }.`;
    case 'usdSend':
      return `Sends ${summary.amount ?? 'an amount'} USDC from your Hyperliquid account to ${
        summary.destination ? abbreviateAddress(summary.destination) : 'a destination address'
      }.`;
    case 'spotSend':
      return `Sends ${summary.amount ?? 'an amount'} ${summary.token ?? 'tokens'} from your Hyperliquid account to ${
        summary.destination ? abbreviateAddress(summary.destination) : 'a destination address'
      }.`;
    case 'setReferrer':
      return `Links this Hyperliquid account to referral code ${summary.code ?? 'unknown'}. A referral code cannot be changed later.`;
    case 'userSetAbstraction':
      return `Changes your Hyperliquid account mode to ${summary.abstraction ?? 'an unknown mode'}.`;
    case 'l1Action':
      return 'Hyperliquid signs trading actions as an opaque hash. The wallet cannot tell which action this is from the payload, so check the request on the site before signing.';
    default:
      return 'The wallet does not recognize this Hyperliquid signature. Check the raw payload before signing.';
  }
}

interface DetailRow {
  label: string;
  value: string;
}

export function getHyperliquidSignatureDetailRows(
  summary: HyperliquidSignatureSummary,
  knownBuilders?: Record<string, string>,
): DetailRow[] {
  const rows: DetailRow[] = [{ label: 'Action', value: getHyperliquidActionLabel(summary) }];
  switch (summary.kind) {
    case 'approveAgent':
      if (summary.agentAddress) {
        rows.push({ label: 'Trading agent', value: abbreviateAddress(summary.agentAddress) });
      }
      if (summary.agentValidUntil) {
        rows.push({
          label: 'Expires',
          value: new Date(summary.agentValidUntil).toLocaleString('en', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        });
      }
      rows.push({ label: 'Can withdraw', value: 'No' });
      break;
    case 'approveBuilderFee':
      rows.push({ label: 'Builder', value: builderLabel(summary.builder, knownBuilders) });
      rows.push({
        label: 'Max fee',
        value:
          summary.feePercent == null
            ? `${summary.maxFeeRate ?? 'Missing or malformed'} (treated as a fee)`
            : `${formatHyperliquidFeePercent(summary.feePercent)} of every trade`,
      });
      rows.push({ label: 'Lasts', value: 'Until you revoke it' });
      break;
    case 'withdraw':
    case 'usdSend':
      if (summary.destination) {
        rows.push({ label: 'Destination', value: abbreviateAddress(summary.destination) });
      }
      if (summary.amount) {
        rows.push({ label: 'Amount', value: `${summary.amount} USDC` });
      }
      break;
    case 'spotSend':
      if (summary.token) rows.push({ label: 'Token', value: summary.token });
      if (summary.destination) {
        rows.push({ label: 'Destination', value: abbreviateAddress(summary.destination) });
      }
      if (summary.amount) rows.push({ label: 'Amount', value: summary.amount });
      break;
    case 'setReferrer':
      if (summary.code) rows.push({ label: 'Referral code', value: summary.code });
      rows.push({ label: 'Can be changed', value: 'No' });
      break;
    case 'userSetAbstraction':
      if (summary.abstraction) rows.push({ label: 'Account mode', value: summary.abstraction });
      break;
    case 'l1Action':
      rows.push({ label: 'Payload', value: 'Hashed action' });
      break;
    default:
      rows.push({ label: 'Type', value: summary.rawPrimaryType || 'Unknown' });
      break;
  }
  return rows;
}

function DetailRowView({ label, value }: DetailRow) {
  return (
    <HStack
      gap={16}
      justifyContent="space-between"
      alignItems="center"
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--neutral-200)',
      }}
    >
      <UIText kind="small/regular" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText
        kind="body/accent"
        style={{ textAlign: 'end', overflowWrap: 'anywhere', minWidth: 0 }}
      >
        {value}
      </UIText>
    </HStack>
  );
}

export function HyperliquidSignatureDetails({
  summary,
  knownBuilders,
}: {
  summary: HyperliquidSignatureSummary;
  knownBuilders?: Record<string, string>;
}) {
  const rows = getHyperliquidSignatureDetailRows(summary, knownBuilders);
  return (
    <Frame>
      <VStack gap={0}>
        <VStack gap={4} style={{ padding: 16 }}>
          <UIText kind="small/regular" color="var(--neutral-600)">
            What you sign
          </UIText>
          <UIText kind="body/regular">{getDescription(summary, knownBuilders)}</UIText>
        </VStack>
        {rows.map((row) => (
          <DetailRowView key={row.label} {...row} />
        ))}
      </VStack>
    </Frame>
  );
}

export function HyperliquidFeeBlocked({
  summary,
  knownBuilders,
  settingsHref,
  onReject,
}: {
  summary: HyperliquidSignatureSummary;
  knownBuilders?: Record<string, string>;
  settingsHref: string;
  onReject: () => void;
}) {
  return (
    <VStack gap={16}>
      <HStack
        gap={12}
        alignItems="flex-start"
        style={{
          backgroundColor: 'var(--negative-100)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <UIText kind="body/accent" color="var(--negative-500)">
          !
        </UIText>
        <UIText kind="body/regular" color="var(--negative-500)">
          This would let another address charge up to{' '}
          {summary.feePercent == null
            ? 'an unreadable fee'
            : formatHyperliquidFeePercent(summary.feePercent)}{' '}
          on every Hyperliquid trade you make. Hyperliquid&apos;s own app does not ask for a builder
          fee while you trade, so another extension probably added it.
        </UIText>
      </HStack>
      <HyperliquidSignatureDetails summary={summary} knownBuilders={knownBuilders} />
      <UIText kind="small/regular" color="var(--neutral-600)">
        Extra Fee Protection is on. To sign anyway, turn it off in{' '}
        <TextLink to={settingsHref} style={{ color: 'var(--primary)', whiteSpace: 'nowrap' }}>
          Settings
        </TextLink>
        .
      </UIText>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <Button kind="primary" onClick={onReject}>
          Reject
        </Button>
      </div>
    </VStack>
  );
}
