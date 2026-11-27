import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';

/** Official Hyperliquid trading frontend. Eligibility checks require this exact origin. */
export const HYPERLIQUID_APP_ORIGIN = 'https://app.hyperliquid.xyz';

/** Domain name for Hyperliquid user-signed actions. */
export const HYPERLIQUID_USER_SIGNED_DOMAIN_NAME = 'HyperliquidSignTransaction';

/** Domain name for Hyperliquid L1 (phantom-agent) signatures. */
export const HYPERLIQUID_L1_DOMAIN_NAME = 'Exchange';

const PRIMARY_TYPE_PREFIX = 'HyperliquidTransaction:';

export type HyperliquidSignatureKind =
  | 'approveAgent'
  | 'approveBuilderFee'
  | 'withdraw'
  | 'usdSend'
  | 'spotSend'
  | 'setReferrer'
  | 'userSetAbstraction'
  | 'l1Action'
  | 'unknown';

export interface HyperliquidSignatureSummary {
  kind: HyperliquidSignatureKind;
  /** Primary type without the `HyperliquidTransaction:` prefix. */
  primaryType: string;
  /** Primary type exactly as it appears in the payload. */
  rawPrimaryType: string;
  /** `Exchange`-domain signatures carry an action hash, not decoded fields. */
  isL1Action: boolean;
  agentAddress?: string;
  agentName?: string;
  agentValidUntil?: number;
  builder?: string;
  maxFeeRate?: string;
  /** Parsed percentage (e.g. 0.1 for "0.1%"); null when malformed or missing. */
  feePercent?: number | null;
  destination?: string;
  amount?: string;
  token?: string;
  code?: string;
  abstraction?: string;
}

export function normalizeOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

/**
 * Exact-origin check. `app.hyperliquid.xyz.evil.test` and other lookalikes do
 * not pass, and neither does a subdomain.
 */
export function isOfficialHyperliquidOrigin(origin: string | null | undefined): boolean {
  return normalizeOrigin(origin) === HYPERLIQUID_APP_ORIGIN;
}

export function isHyperliquidTypedData(typedData: TypedData): boolean {
  const name = typedData.domain?.name;
  return name === HYPERLIQUID_USER_SIGNED_DOMAIN_NAME || name === HYPERLIQUID_L1_DOMAIN_NAME;
}

function readString(message: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = message[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Parses a Hyperliquid fee rate ("0.1%") into a percentage number. Returns
 * null for anything that is not a finite, non-negative percentage, so callers
 * can treat malformed or missing values as "a fee is present".
 */
export function parseHyperliquidFeePercent(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.endsWith('%')) return null;
  const numericPart = trimmed.slice(0, -1).trim();
  if (!numericPart) return null;
  // Digits and at most one decimal point; keeps the parser strict without a
  // backtracking regex over user-controlled input.
  let dotCount = 0;
  for (const char of numericPart) {
    if (char === '.') {
      dotCount += 1;
      if (dotCount > 1) return null;
      continue;
    }
    if (char < '0' || char > '9') return null;
  }
  const parsed = Number(numericPart);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Strict zero check. Anything that is not a parseable exactly-zero percentage,
 * including a missing value, is NOT zero.
 */
export function isZeroHyperliquidFeeRate(value: unknown): boolean {
  return parseHyperliquidFeePercent(value) === 0;
}

export function formatHyperliquidFeePercent(percent: number | null | undefined): string {
  if (percent == null || !Number.isFinite(percent)) return 'Unknown';
  if (percent === 0) return '0%';
  if (percent < 0.01) {
    return `${percent.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}%`;
  }
  return `${percent.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
}

function parseValidUntil(agentName: string | undefined): number | undefined {
  const match = agentName?.match(/ valid_until (\d+)$/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function stripPrefix(primaryType: string): string {
  return primaryType.startsWith(PRIMARY_TYPE_PREFIX)
    ? primaryType.slice(PRIMARY_TYPE_PREFIX.length)
    : primaryType;
}

/**
 * Decodes the Hyperliquid fields the wallet can trust from a typed-data
 * payload. Never guesses values that are absent: unknown payloads come back as
 * `kind: 'unknown'` and keep the raw payload visible in the signing UI.
 */
export function getHyperliquidSignatureSummary(
  typedData: TypedData,
): HyperliquidSignatureSummary | null {
  const domainName = typedData.domain?.name;
  if (
    domainName !== HYPERLIQUID_USER_SIGNED_DOMAIN_NAME &&
    domainName !== HYPERLIQUID_L1_DOMAIN_NAME
  ) {
    return null;
  }
  const rawPrimaryType = typedData.primaryType ?? '';
  const primaryType = stripPrefix(rawPrimaryType);

  if (domainName === HYPERLIQUID_L1_DOMAIN_NAME || primaryType === 'Agent') {
    return {
      kind: 'l1Action',
      primaryType,
      rawPrimaryType,
      isL1Action: true,
    };
  }

  const message = (typedData.message ?? {}) as Record<string, unknown>;
  const base = { primaryType, rawPrimaryType, isL1Action: false as const };

  switch (primaryType) {
    case 'ApproveAgent': {
      const agentAddress = readString(message, ['agentAddress', 'agent']);
      const agentName = readString(message, ['agentName']);
      return {
        ...base,
        kind: 'approveAgent',
        agentAddress,
        agentName,
        agentValidUntil: parseValidUntil(agentName),
      };
    }
    case 'ApproveBuilderFee': {
      const maxFeeRate = readString(message, ['maxFeeRate']);
      return {
        ...base,
        kind: 'approveBuilderFee',
        builder: readString(message, ['builder']),
        maxFeeRate,
        feePercent: parseHyperliquidFeePercent(maxFeeRate),
      };
    }
    case 'Withdraw': {
      return {
        ...base,
        kind: 'withdraw',
        destination: readString(message, ['destination']),
        amount: readString(message, ['amount']),
      };
    }
    case 'UsdSend': {
      return {
        ...base,
        kind: 'usdSend',
        destination: readString(message, ['destination']),
        amount: readString(message, ['amount']),
      };
    }
    case 'SpotSend': {
      return {
        ...base,
        kind: 'spotSend',
        destination: readString(message, ['destination']),
        token: readString(message, ['token']),
        amount: readString(message, ['amount']),
      };
    }
    case 'SetReferrer': {
      return {
        ...base,
        kind: 'setReferrer',
        code: readString(message, ['code']),
      };
    }
    case 'UserSetAbstraction': {
      return {
        ...base,
        kind: 'userSetAbstraction',
        abstraction: readString(message, ['abstraction']),
      };
    }
    default:
      return { ...base, kind: 'unknown' };
  }
}

export interface ExtraFeeProtectionInput {
  origin: string | null | undefined;
  typedData: TypedData;
  protectionEnabled: boolean;
}

export interface ExtraFeeProtectionDecision {
  /** A builder-fee approval the official Hyperliquid origin should never ask for. */
  isSuspiciousBuilderFee: boolean;
  /** The signing UI must not offer Sign while protection is on. */
  blocked: boolean;
  summary: HyperliquidSignatureSummary | null;
}

/**
 * Extra Fee Protection: an official Hyperliquid frontend asking for a
 * non-zero builder fee is treated as an injected approval. Missing or
 * malformed `maxFeeRate` counts as a fee.
 */
export function getExtraFeeProtectionDecision({
  origin,
  typedData,
  protectionEnabled,
}: ExtraFeeProtectionInput): ExtraFeeProtectionDecision {
  const summary = getHyperliquidSignatureSummary(typedData);
  const isSuspiciousBuilderFee =
    isOfficialHyperliquidOrigin(origin) &&
    summary?.kind === 'approveBuilderFee' &&
    !isZeroHyperliquidFeeRate(summary.maxFeeRate);
  return {
    isSuspiciousBuilderFee,
    blocked: protectionEnabled && isSuspiciousBuilderFee,
    summary,
  };
}
