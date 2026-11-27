import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import {
  getExtraFeeProtectionDecision,
  getHyperliquidSignatureSummary,
  isOfficialHyperliquidOrigin,
  isZeroHyperliquidFeeRate,
  parseHyperliquidFeePercent,
} from './hyperliquidTypedData';

function hyperliquidTypedData(
  primaryType: string,
  message: Record<string, unknown> = {},
): TypedData {
  return {
    domain: {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId: 42161,
      verifyingContract: '0x0000000000000000000000000000000000000000',
    },
    types: {
      EIP712Domain: [],
      [`HyperliquidTransaction:${primaryType}`]: [],
    },
    primaryType: `HyperliquidTransaction:${primaryType}`,
    message,
  };
}

describe('isOfficialHyperliquidOrigin', () => {
  test('accepts the exact official origin', () => {
    expect(isOfficialHyperliquidOrigin('https://app.hyperliquid.xyz')).toBe(true);
    expect(isOfficialHyperliquidOrigin('https://app.hyperliquid.xyz/')).toBe(true);
    expect(isOfficialHyperliquidOrigin('https://app.hyperliquid.xyz/trade')).toBe(true);
  });

  test('rejects lookalikes, subdomains and other schemes', () => {
    expect(isOfficialHyperliquidOrigin('https://app.hyperliquid.xyz.evil.test')).toBe(false);
    expect(isOfficialHyperliquidOrigin('https://app.hyperliquid.xyz@evil.test')).toBe(false);
    expect(isOfficialHyperliquidOrigin('https://trade.app.hyperliquid.xyz')).toBe(false);
    expect(isOfficialHyperliquidOrigin('http://app.hyperliquid.xyz')).toBe(false);
    expect(isOfficialHyperliquidOrigin('https://hyperliquid.xyz')).toBe(false);
    expect(isOfficialHyperliquidOrigin(null)).toBe(false);
  });
});

describe('parseHyperliquidFeePercent', () => {
  test('parses the documented percentage format', () => {
    expect(parseHyperliquidFeePercent('0.1%')).toBe(0.1);
    expect(parseHyperliquidFeePercent('0.04%')).toBe(0.04);
    expect(parseHyperliquidFeePercent('0%')).toBe(0);
    expect(parseHyperliquidFeePercent(' 0.0 % ')).toBe(0);
    expect(parseHyperliquidFeePercent(0.1)).toBe(0.1);
  });

  test('missing and malformed values are unknown, not zero', () => {
    expect(parseHyperliquidFeePercent(undefined)).toBeNull();
    expect(parseHyperliquidFeePercent(null)).toBeNull();
    expect(parseHyperliquidFeePercent('')).toBeNull();
    expect(parseHyperliquidFeePercent('0.1')).toBeNull();
    expect(parseHyperliquidFeePercent('-1%')).toBeNull();
    expect(parseHyperliquidFeePercent('ten percent')).toBeNull();
    expect(parseHyperliquidFeePercent(Number.NaN)).toBeNull();
    expect(parseHyperliquidFeePercent(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('isZeroHyperliquidFeeRate', () => {
  test('only a parseable zero is zero', () => {
    expect(isZeroHyperliquidFeeRate('0%')).toBe(true);
    expect(isZeroHyperliquidFeeRate('0.00%')).toBe(true);
    expect(isZeroHyperliquidFeeRate(0)).toBe(true);
    expect(isZeroHyperliquidFeeRate(undefined)).toBe(false);
    expect(isZeroHyperliquidFeeRate('')).toBe(false);
    expect(isZeroHyperliquidFeeRate('0.1%')).toBe(false);
    expect(isZeroHyperliquidFeeRate('garbage')).toBe(false);
  });
});

describe('getHyperliquidSignatureSummary', () => {
  test('returns null for non-Hyperliquid domains', () => {
    expect(
      getHyperliquidSignatureSummary({
        domain: { name: 'Permit2' },
        types: {},
        primaryType: 'PermitSingle',
        message: {},
      }),
    ).toBeNull();
  });

  test('decodes ApproveBuilderFee including a malformed fee', () => {
    const summary = getHyperliquidSignatureSummary(
      hyperliquidTypedData('ApproveBuilderFee', {
        hyperliquidChain: 'Mainnet',
        maxFeeRate: '0.1%',
        builder: '0x7a1e00000000000000000000000000000000c3f0',
        nonce: 1,
      }),
    );
    expect(summary).toMatchObject({
      kind: 'approveBuilderFee',
      primaryType: 'ApproveBuilderFee',
      builder: '0x7a1e00000000000000000000000000000000c3f0',
      maxFeeRate: '0.1%',
      feePercent: 0.1,
      isL1Action: false,
    });

    const malformed = getHyperliquidSignatureSummary(
      hyperliquidTypedData('ApproveBuilderFee', { maxFeeRate: 'not-a-fee', builder: '0xabc' }),
    );
    expect(malformed?.kind).toBe('approveBuilderFee');
    expect(malformed?.feePercent).toBeNull();
  });

  test('decodes ApproveAgent and its expiration suffix', () => {
    const summary = getHyperliquidSignatureSummary(
      hyperliquidTypedData('ApproveAgent', {
        agentAddress: '0x1111111111111111111111111111111111111111',
        agentName: 'web valid_until 1767225600000',
      }),
    );
    expect(summary).toMatchObject({
      kind: 'approveAgent',
      agentAddress: '0x1111111111111111111111111111111111111111',
      agentName: 'web valid_until 1767225600000',
      agentValidUntil: 1767225600000,
    });
  });

  test('decodes transfer, withdraw and referrer payloads', () => {
    expect(
      getHyperliquidSignatureSummary(
        hyperliquidTypedData('Withdraw', { destination: '0xabc', amount: '12.5' }),
      ),
    ).toMatchObject({ kind: 'withdraw', destination: '0xabc', amount: '12.5' });
    expect(
      getHyperliquidSignatureSummary(
        hyperliquidTypedData('UsdSend', { destination: '0xabc', amount: '1' }),
      ),
    ).toMatchObject({ kind: 'usdSend', destination: '0xabc', amount: '1' });
    expect(
      getHyperliquidSignatureSummary(
        hyperliquidTypedData('SpotSend', {
          destination: '0xabc',
          token: 'USDC:0xdef',
          amount: '3',
        }),
      ),
    ).toMatchObject({ kind: 'spotSend', token: 'USDC:0xdef', amount: '3' });
    expect(
      getHyperliquidSignatureSummary(hyperliquidTypedData('SetReferrer', { code: 'ZERION' })),
    ).toMatchObject({ kind: 'setReferrer', code: 'ZERION' });
  });

  test('flags Exchange-domain L1 actions instead of inventing fields', () => {
    const summary = getHyperliquidSignatureSummary({
      domain: { name: 'Exchange', version: '1', chainId: 1337 },
      types: {},
      primaryType: 'Agent',
      message: { source: 'a', connectionId: '0x' + '00'.repeat(32) },
    });
    expect(summary).toMatchObject({ kind: 'l1Action', isL1Action: true });
  });

  test('unknown primary types stay unknown', () => {
    expect(getHyperliquidSignatureSummary(hyperliquidTypedData('SomeNewAction', {}))).toMatchObject(
      { kind: 'unknown', primaryType: 'SomeNewAction' },
    );
  });
});

describe('getExtraFeeProtectionDecision', () => {
  const official = 'https://app.hyperliquid.xyz';

  test('blocks non-zero builder fees from the official origin', () => {
    const decision = getExtraFeeProtectionDecision({
      origin: official,
      typedData: hyperliquidTypedData('ApproveBuilderFee', { maxFeeRate: '0.1%' }),
      protectionEnabled: true,
    });
    expect(decision.isSuspiciousBuilderFee).toBe(true);
    expect(decision.blocked).toBe(true);
  });

  test('blocks missing and malformed fees', () => {
    for (const maxFeeRate of [undefined, '', 'oops', '-0.1%', null]) {
      const decision = getExtraFeeProtectionDecision({
        origin: official,
        typedData: hyperliquidTypedData('ApproveBuilderFee', { maxFeeRate }),
        protectionEnabled: true,
      });
      expect(decision.blocked).toBe(true);
    }
  });

  test('allows an explicit zero fee', () => {
    const decision = getExtraFeeProtectionDecision({
      origin: official,
      typedData: hyperliquidTypedData('ApproveBuilderFee', { maxFeeRate: '0%' }),
      protectionEnabled: true,
    });
    expect(decision.isSuspiciousBuilderFee).toBe(false);
    expect(decision.blocked).toBe(false);
  });

  test('the setting turns blocking off, but the approval stays suspicious', () => {
    const decision = getExtraFeeProtectionDecision({
      origin: official,
      typedData: hyperliquidTypedData('ApproveBuilderFee', { maxFeeRate: '0.1%' }),
      protectionEnabled: false,
    });
    expect(decision.isSuspiciousBuilderFee).toBe(true);
    expect(decision.blocked).toBe(false);
  });

  test('does not block other origins, other actions or other domains', () => {
    expect(
      getExtraFeeProtectionDecision({
        origin: 'https://app.hyperliquid.xyz.evil.test',
        typedData: hyperliquidTypedData('ApproveBuilderFee', { maxFeeRate: '0.1%' }),
        protectionEnabled: true,
      }).blocked,
    ).toBe(false);
    expect(
      getExtraFeeProtectionDecision({
        origin: official,
        typedData: hyperliquidTypedData('ApproveAgent', {}),
        protectionEnabled: true,
      }).blocked,
    ).toBe(false);
    expect(
      getExtraFeeProtectionDecision({
        origin: official,
        typedData: {
          domain: { name: 'Permit2' },
          types: {},
          primaryType: 'PermitSingle',
          message: {},
        },
        protectionEnabled: true,
      }).blocked,
    ).toBe(false);
  });
});
