import BigNumber from 'bignumber.js';
import { describe, expect, it } from '@jest/globals';
import type { TypedDataDocument } from 'src/shared/types/Quote';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import {
  buildExpectedIntentSigning,
  findIntentTypedDataProblems,
  type ExpectedIntentSigning,
} from './intentTypedData';
import {
  RELAY_PERMIT2_BATCH,
  RELAY_RECEIVE_WITH_AUTHORIZATION,
  UNISWAPX_DUTCH_V2,
  ZEROX_GASLESS_PERMIT,
  ZEROX_GASLESS_TRADE,
} from './intentTypedData.fixtures';

const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BASE_WETH = '0x4200000000000000000000000000000000000006';
const MAINNET_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const OTHER_TOKEN = '0x1111111111111111111111111111111111111111';

const checkIntentTypedData = (
  document: TypedDataDocument,
  expected: ExpectedIntentSigning
) =>
  findIntentTypedDataProblems(document, expected).map(
    (problem) => problem.message
  );

const expectedFor = (
  overrides: Partial<ExpectedIntentSigning> & { maxSellAmount: BigNumber }
): ExpectedIntentSigning => ({
  chainId: 8453,
  sellToken: BASE_USDC,
  nowSeconds: 1_783_000_000,
  ...overrides,
});

/** Each real document with the trade it was quoted for (amounts in base units) */
const REAL: Array<[string, TypedDataDocument, ExpectedIntentSigning]> = [
  [
    '0x Gasless EIP-2612 permit',
    ZEROX_GASLESS_PERMIT,
    expectedFor({ maxSellAmount: new BigNumber('100000000') }),
  ],
  [
    '0x Gasless Permit2 witness trade',
    ZEROX_GASLESS_TRADE,
    expectedFor({ maxSellAmount: new BigNumber('100000000') }),
  ],
  [
    'Relay EIP-3009 ReceiveWithAuthorization',
    RELAY_RECEIVE_WITH_AUTHORIZATION,
    expectedFor({ maxSellAmount: new BigNumber('5000000') }),
  ],
  [
    'Relay Permit2 batch witness',
    RELAY_PERMIT2_BATCH,
    expectedFor({
      sellToken: BASE_WETH,
      maxSellAmount: new BigNumber('2000000000000000'),
    }),
  ],
  [
    'UniswapX Permit2 witness (Dutch V2)',
    UNISWAPX_DUTCH_V2,
    expectedFor({
      chainId: 1,
      sellToken: MAINNET_USDC,
      maxSellAmount: new BigNumber('5000000000'),
    }),
  ],
];

function withMessage(
  document: TypedDataDocument,
  patch: Record<string, unknown>
): TypedDataDocument {
  return {
    ...document,
    message: { ...(document.message as Record<string, unknown>), ...patch },
  };
}

function withDomain(
  document: TypedDataDocument,
  patch: Record<string, unknown>
): TypedDataDocument {
  return { ...document, domain: { ...document.domain, ...patch } };
}

describe('checkIntentTypedData — real provider documents', () => {
  it.each(REAL)('%s passes for the trade it was quoted for', (_, doc, exp) => {
    expect(checkIntentTypedData(doc, exp)).toEqual([]);
  });

  it.each(REAL)('%s is refused on another chain', (_, doc, exp) => {
    expect(
      checkIntentTypedData(doc, { ...exp, chainId: exp.chainId! + 1 })
    ).toEqual([
      `domain chainId ${doc.domain.chainId} is not the input chain ${
        exp.chainId! + 1
      }`,
    ]);
  });

  it.each(REAL)('%s is refused for another sell token', (_, doc, exp) => {
    const problems = checkIntentTypedData(doc, {
      ...exp,
      sellToken: OTHER_TOKEN,
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/is not the sell token 0x1111/);
  });

  it.each(REAL)('%s is refused once its deadline has passed', (_, doc, exp) => {
    const problems = checkIntentTypedData(doc, {
      ...exp,
      nowSeconds: 1_790_000_000,
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/is not in the future \(now 1790000000\)/);
  });

  it.each(REAL)(
    '%s marks only its passed deadline as expired',
    (_, doc, exp) => {
      expect(
        findIntentTypedDataProblems(doc, {
          ...exp,
          sellToken: OTHER_TOKEN,
          nowSeconds: 1_790_000_000,
        }).map((problem) => problem.expired)
      ).toEqual([false, true]);
    }
  );
});

describe('checkIntentTypedData — amounts', () => {
  const [, , zeroxTradeExpected] = REAL[1];
  const [, , relayExpected] = REAL[2];
  const [, , batchExpected] = REAL[3];

  it('Permit2: one base unit over the quoted input is refused, equal passes', () => {
    expect(
      checkIntentTypedData(ZEROX_GASLESS_TRADE, {
        ...zeroxTradeExpected,
        maxSellAmount: new BigNumber('99999999'),
      })
    ).toEqual(['Permit2 amount 100000000 exceeds the quoted input 99999999']);
    expect(
      checkIntentTypedData(ZEROX_GASLESS_TRADE, zeroxTradeExpected)
    ).toEqual([]);
  });

  it('Permit2: a fractional quoted input (more decimals than the token) bounds from above', () => {
    expect(
      checkIntentTypedData(ZEROX_GASLESS_TRADE, {
        ...zeroxTradeExpected,
        maxSellAmount: new BigNumber('100000000.5'),
      })
    ).toEqual([]);
  });

  it('Permit2 batch: the amounts of every permitted entry count, and every token must be the sell token', () => {
    const permitted = (RELAY_PERMIT2_BATCH.message as { permitted: unknown[] })
      .permitted[0] as Record<string, string>;
    expect(
      checkIntentTypedData(
        withMessage(RELAY_PERMIT2_BATCH, { permitted: [permitted, permitted] }),
        batchExpected
      )
    ).toEqual([
      'Permit2 amount 4000000000000000 exceeds the quoted input 2000000000000000',
    ]);
    expect(
      checkIntentTypedData(
        withMessage(RELAY_PERMIT2_BATCH, {
          permitted: [permitted, { token: OTHER_TOKEN, amount: '0' }],
        }),
        batchExpected
      )
    ).toEqual([
      `Permit2 token ${OTHER_TOKEN} is not the sell token ${BASE_WETH}`,
    ]);
  });

  it('EIP-3009: a value over the quoted input is refused', () => {
    expect(
      checkIntentTypedData(
        withMessage(RELAY_RECEIVE_WITH_AUTHORIZATION, { value: '5000001' }),
        relayExpected
      )
    ).toEqual(['Authorization value 5000001 exceeds the quoted input 5000000']);
  });

  it('EIP-3009 TransferWithAuthorization is checked the same way', () => {
    const transfer: TypedDataDocument = {
      ...RELAY_RECEIVE_WITH_AUTHORIZATION,
      primaryType: 'TransferWithAuthorization',
      types: {
        TransferWithAuthorization:
          RELAY_RECEIVE_WITH_AUTHORIZATION.types.ReceiveWithAuthorization,
      },
    };
    expect(checkIntentTypedData(transfer, relayExpected)).toEqual([]);
    expect(
      checkIntentTypedData(
        withMessage(transfer, { value: '6000000' }),
        relayExpected
      )
    ).toEqual(['Authorization value 6000000 exceeds the quoted input 5000000']);
  });

  it('EIP-2612: the allowance is not bounded (0x permits Permit2 the maximum uint256)', () => {
    const [, , permitExpected] = REAL[0];
    expect((ZEROX_GASLESS_PERMIT.message as { value: string }).value).toBe(
      new BigNumber(2).pow(256).minus(1).toFixed()
    );
    expect(checkIntentTypedData(ZEROX_GASLESS_PERMIT, permitExpected)).toEqual(
      []
    );
  });

  it('an unparseable amount is refused, never compared loosely', () => {
    const permitted = (ZEROX_GASLESS_TRADE.message as { permitted: object })
      .permitted;
    expect(
      checkIntentTypedData(
        withMessage(ZEROX_GASLESS_TRADE, {
          permitted: { ...permitted, amount: '0x5f5e100' },
        }),
        zeroxTradeExpected
      )
    ).toEqual(['Permit2 amount invalid exceeds the quoted input 100000000']);
  });

  it('an unknown quoted input refuses a primitive that moves tokens', () => {
    expect(
      checkIntentTypedData(RELAY_RECEIVE_WITH_AUTHORIZATION, {
        ...relayExpected,
        maxSellAmount: null,
      })
    ).toEqual(['Authorization value 5000000 exceeds the quoted input unknown']);
  });
});

describe('checkIntentTypedData — the order payload is not verified', () => {
  it('a UniswapX witness paying another recipient still passes: only the Permit2 envelope is checked', () => {
    const [, , exp] = REAL[4];
    const witness = (UNISWAPX_DUTCH_V2.message as { witness: object }).witness;
    expect(
      checkIntentTypedData(
        withMessage(UNISWAPX_DUTCH_V2, {
          witness: { ...witness, baseOutputs: [] },
        }),
        exp
      )
    ).toEqual([]);
  });
});

describe('checkIntentTypedData — well-formedness', () => {
  const [, , exp] = REAL[1];

  it('a primaryType missing from types is refused', () => {
    expect(
      checkIntentTypedData(
        { ...ZEROX_GASLESS_TRADE, primaryType: 'Missing' },
        exp
      )
    ).toEqual(['primaryType Missing is not declared in types']);
  });

  it('a message given as a JSON string is read like an object', () => {
    expect(
      checkIntentTypedData(
        {
          ...ZEROX_GASLESS_TRADE,
          message: JSON.stringify(ZEROX_GASLESS_TRADE.message),
        },
        exp
      )
    ).toEqual([]);
  });

  it.each([
    ['an unparseable JSON string', '{"permitted":'],
    ['a JSON array', '[1,2]'],
    ['a JSON scalar', '"x"'],
  ])('a message that is %s is refused', (_, message) => {
    expect(
      checkIntentTypedData({ ...ZEROX_GASLESS_TRADE, message }, exp)
    ).toEqual(['message is not an object']);
  });

  it('a declared EIP712Domain missing a set domain field is refused', () => {
    expect(
      checkIntentTypedData(
        withDomain(ZEROX_GASLESS_TRADE, { version: '1' }),
        exp
      )
    ).toEqual([
      'EIP712Domain declares name string, chainId uint256, verifyingContract address but the domain sets name, version, chainId, verifyingContract',
    ]);
  });

  it('a declared EIP712Domain field the domain does not set is refused', () => {
    expect(
      checkIntentTypedData(
        withDomain(ZEROX_GASLESS_PERMIT, { version: undefined }),
        REAL[0][2]
      )
    ).toEqual([
      'EIP712Domain declares name string, version string, chainId uint256, verifyingContract address but the domain sets name, chainId, verifyingContract',
    ]);
  });

  it('an empty-string domain field counts as unset', () => {
    expect(
      checkIntentTypedData(
        withDomain(ZEROX_GASLESS_TRADE, { version: '' }),
        exp
      )
    ).toEqual([]);
  });

  it('a domain field the signer would not declare is refused', () => {
    expect(
      checkIntentTypedData(
        withDomain(RELAY_RECEIVE_WITH_AUTHORIZATION, { extra: 'x' }),
        REAL[2][2]
      )
    ).toEqual(['domain has unsupported fields: extra']);
  });
});

describe('checkIntentTypedData — chain id forms', () => {
  const [, , exp] = REAL[2];

  it.each([['8453'], ['0x2105']])(
    'domain chainId %s reads as 8453',
    (chainId) => {
      expect(
        checkIntentTypedData(
          withDomain(RELAY_RECEIVE_WITH_AUTHORIZATION, { chainId }),
          exp
        )
      ).toEqual([]);
    }
  );

  it('a malformed chainId is refused', () => {
    expect(
      checkIntentTypedData(
        withDomain(RELAY_RECEIVE_WITH_AUTHORIZATION, { chainId: '8453.0' }),
        exp
      )
    ).toEqual(['domain chainId 8453.0 is not the input chain 8453']);
  });

  it('an input chain without an EIP-155 id refuses any chainId', () => {
    expect(
      checkIntentTypedData(RELAY_RECEIVE_WITH_AUTHORIZATION, {
        ...exp,
        chainId: null,
      })
    ).toEqual(['domain chainId 8453 is not the input chain unknown']);
  });
});

describe('checkIntentTypedData — ERC-20 approve meta-transaction', () => {
  const approveCall = (selector: string) =>
    `${selector}${'000000000022d473030f116ddee9f6b43ac78ba3'.padStart(
      64,
      '0'
    )}${'f'.repeat(64)}`;
  const metaTransaction = (functionSignature: string): TypedDataDocument => ({
    types: {
      MetaTransaction: [
        { name: 'nonce', type: 'uint256' },
        { name: 'from', type: 'address' },
        { name: 'functionSignature', type: 'bytes' },
      ],
    },
    primaryType: 'MetaTransaction',
    domain: {
      name: 'USD Coin (PoS)',
      version: '1',
      verifyingContract: BASE_USDC,
      salt: `0x${(8453).toString(16).padStart(64, '0')}`,
    },
    message: {
      nonce: 0,
      from: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
      functionSignature,
    },
  });
  const exp = expectedFor({ maxSellAmount: new BigNumber('100000000') });

  it('an approve of the sell token passes (no chainId in a salted domain)', () => {
    expect(
      checkIntentTypedData(metaTransaction(approveCall('0x095ea7b3')), exp)
    ).toEqual([]);
  });

  it('any other call is refused', () => {
    expect(
      checkIntentTypedData(metaTransaction(approveCall('0xa9059cbb')), exp)
    ).toEqual(['MetaTransaction calls 0xa9059cbb, not ERC-20 approve']);
  });

  it('an approve of another token is refused', () => {
    expect(
      checkIntentTypedData(metaTransaction(approveCall('0x095ea7b3')), {
        ...exp,
        sellToken: OTHER_TOKEN,
      })
    ).toEqual([
      `MetaTransaction token ${BASE_USDC} is not the sell token ${OTHER_TOKEN}`,
    ]);
  });
});

describe('checkIntentTypedData — unknown schemas', () => {
  const cowOrder: TypedDataDocument = {
    types: {
      Order: [
        { name: 'sellToken', type: 'address' },
        { name: 'buyToken', type: 'address' },
        { name: 'sellAmount', type: 'uint256' },
        { name: 'buyAmount', type: 'uint256' },
        { name: 'validTo', type: 'uint32' },
        { name: 'kind', type: 'string' },
      ],
    },
    primaryType: 'Order',
    domain: {
      name: 'Gnosis Protocol',
      version: 'v2',
      chainId: 8453,
      verifyingContract: '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
    },
    message: {
      sellToken: OTHER_TOKEN,
      buyToken: BASE_WETH,
      sellAmount: '999999999999',
      buyAmount: '1',
      validTo: 1,
      kind: 'sell',
    },
  };
  const exp = expectedFor({ maxSellAmount: new BigNumber('100000000') });

  it('any other schema is allowed when well formed and on the input chain', () => {
    expect(checkIntentTypedData(cowOrder, exp)).toEqual([]);
  });

  it('it is still refused on another chain', () => {
    expect(
      checkIntentTypedData(withDomain(cowOrder, { chainId: 1 }), exp)
    ).toEqual(['domain chainId 1 is not the input chain 8453']);
  });

  it('a Permit-named struct of no standard shape gets checks 1 and 2 only', () => {
    const customPermit: TypedDataDocument = {
      types: {
        Permit: [
          { name: 'grantee', type: 'address' },
          { name: 'until', type: 'uint256' },
        ],
      },
      primaryType: 'Permit',
      domain: { name: 'X', chainId: 8453, verifyingContract: OTHER_TOKEN },
      message: { grantee: OTHER_TOKEN, until: 0 },
    };
    expect(checkIntentTypedData(customPermit, exp)).toEqual([]);
  });
});

describe('checkIntentTypedData — DAI-style Permit', () => {
  const daiPermit = (
    verifyingContract: string,
    expiry: number | string
  ): TypedDataDocument => ({
    types: {
      Permit: [
        { name: 'holder', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'allowed', type: 'bool' },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name: 'Dai Stablecoin',
      version: '1',
      chainId: 8453,
      verifyingContract,
    },
    message: {
      holder: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
      spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
      nonce: 0,
      expiry,
      allowed: true,
    },
  });
  const exp = expectedFor({ maxSellAmount: new BigNumber('100000000') });

  it('a permit of the sell token with a future expiry passes', () => {
    expect(
      checkIntentTypedData(daiPermit(BASE_USDC, 1_783_000_001), exp)
    ).toEqual([]);
  });

  it('expiry 0 means no expiry and passes', () => {
    expect(checkIntentTypedData(daiPermit(BASE_USDC, 0), exp)).toEqual([]);
  });

  it('a past expiry is refused', () => {
    expect(
      checkIntentTypedData(daiPermit(BASE_USDC, 1_782_999_999), exp)
    ).toEqual([
      'Permit expiry 1782999999 is not in the future (now 1783000000)',
    ]);
  });

  it('a permit of another token is refused', () => {
    expect(checkIntentTypedData(daiPermit(OTHER_TOKEN, 0), exp)).toEqual([
      `Permit token ${OTHER_TOKEN} is not the sell token ${BASE_USDC}`,
    ]);
  });
});

describe('checkIntentTypedData — Permit2 AllowanceTransfer', () => {
  const PERMIT_DETAILS = [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint160' },
    { name: 'expiration', type: 'uint48' },
    { name: 'nonce', type: 'uint48' },
  ];
  const details = (token: string, expiration: number) => ({
    token,
    amount: '1461501637330902918203684832716283019655932542975',
    expiration,
    nonce: 0,
  });
  const permitSingle = (
    entry: ReturnType<typeof details>,
    sigDeadline: number
  ): TypedDataDocument => ({
    types: {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: PERMIT_DETAILS,
    },
    primaryType: 'PermitSingle',
    domain: {
      name: 'Permit2',
      chainId: 8453,
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
    },
    message: {
      details: entry,
      spender: '0x6ff5693b99212da76ad316178a184ab56d299b43',
      sigDeadline,
    },
  });
  const permitBatch = (
    entries: Array<ReturnType<typeof details>>,
    sigDeadline: number
  ): TypedDataDocument => ({
    types: {
      PermitBatch: [
        { name: 'details', type: 'PermitDetails[]' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: PERMIT_DETAILS,
    },
    primaryType: 'PermitBatch',
    domain: {
      name: 'Permit2',
      chainId: 8453,
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
    },
    message: {
      details: entries,
      spender: '0x6ff5693b99212da76ad316178a184ab56d299b43',
      sigDeadline,
    },
  });
  const LATER = 1_783_000_600;
  const PAST = 1_782_999_000;
  const exp = expectedFor({ maxSellAmount: new BigNumber('100000000') });

  it('PermitSingle of the sell token with future deadlines passes; its max uint160 amount is not bounded', () => {
    expect(
      checkIntentTypedData(permitSingle(details(BASE_USDC, LATER), LATER), exp)
    ).toEqual([]);
  });

  it('PermitSingle of another token is refused', () => {
    expect(
      checkIntentTypedData(
        permitSingle(details(OTHER_TOKEN, LATER), LATER),
        exp
      )
    ).toEqual([
      `Permit2 allowance token ${OTHER_TOKEN} is not the sell token ${BASE_USDC}`,
    ]);
  });

  it('a past sigDeadline is refused', () => {
    expect(
      checkIntentTypedData(permitSingle(details(BASE_USDC, LATER), PAST), exp)
    ).toEqual([
      `Permit2 sigDeadline ${PAST} is not in the future (now 1783000000)`,
    ]);
  });

  it('a past details.expiration is refused', () => {
    expect(
      checkIntentTypedData(permitSingle(details(BASE_USDC, PAST), LATER), exp)
    ).toEqual([
      `Permit2 allowance expiration ${PAST} is not in the future (now 1783000000)`,
    ]);
  });

  it('PermitBatch checks every entry', () => {
    expect(
      checkIntentTypedData(
        permitBatch(
          [details(BASE_USDC, LATER), details(BASE_USDC, LATER)],
          LATER
        ),
        exp
      )
    ).toEqual([]);
    expect(
      checkIntentTypedData(
        permitBatch(
          [details(BASE_USDC, LATER), details(OTHER_TOKEN, PAST)],
          LATER
        ),
        exp
      )
    ).toEqual([
      `Permit2 allowance token ${OTHER_TOKEN} is not the sell token ${BASE_USDC}`,
      `Permit2 allowance expiration ${PAST} is not in the future (now 1783000000)`,
    ]);
  });

  it('an empty PermitBatch is refused', () => {
    expect(checkIntentTypedData(permitBatch([], LATER), exp)).toEqual([
      'Permit2 allowance covers no token',
    ]);
  });
});

describe('buildExpectedIntentSigning', () => {
  const network = {
    id: 'base',
    specification: { eip155: { chainId: 8453 } },
  } as unknown as NetworkInfo;
  const asset = (implementations: Fungible['implementations']) =>
    ({ id: 'usdc', implementations } as unknown as Fungible);

  it('reads the sell token, its base-unit amount and the chain from the input side', () => {
    expect(
      buildExpectedIntentSigning({
        inputAmount: '1.5',
        inputNetwork: network,
        inputFungible: asset({
          base: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6,
          },
        }),
        nowSeconds: 7,
      })
    ).toEqual({
      chainId: 8453,
      sellToken: BASE_USDC,
      maxSellAmount: new BigNumber('1500000'),
      nowSeconds: 7,
    });
  });

  it('a native asset reads as native; an asset without an implementation on the chain as unknown', () => {
    const build = (implementations: Fungible['implementations']) =>
      buildExpectedIntentSigning({
        inputAmount: '1',
        inputNetwork: network,
        inputFungible: asset(implementations),
        nowSeconds: 0,
      });
    expect(build({ base: { address: null, decimals: 18 } })).toMatchObject({
      sellToken: 'native',
      maxSellAmount: new BigNumber('1e18'),
    });
    expect(
      build({ ethereum: { address: MAINNET_USDC, decimals: 6 } })
    ).toMatchObject({
      sellToken: null,
      maxSellAmount: null,
    });
  });

  it('an input chain without an EIP-155 id has no expected chain id', () => {
    expect(
      buildExpectedIntentSigning({
        inputAmount: '1',
        inputNetwork: { ...network, specification: {} } as NetworkInfo,
        inputFungible: asset({ base: { address: BASE_USDC, decimals: 6 } }),
        nowSeconds: 0,
      }).chainId
    ).toBeNull();
  });
});

describe('findIntentTypedDataProblems — only a parsed, passed deadline is expired', () => {
  const NOW = 1_783_000_000;
  const PAST = NOW - 1;
  const SPENDER = '0x000000000022d473030f116ddee9f6b43ac78ba3';
  const usdc = expectedFor({
    maxSellAmount: new BigNumber('100000000'),
    nowSeconds: NOW,
  });
  const daiPermit = (expiry: unknown): TypedDataDocument => ({
    types: {
      Permit: [
        { name: 'holder', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'allowed', type: 'bool' },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name: 'Dai',
      version: '1',
      chainId: 8453,
      verifyingContract: BASE_USDC,
    },
    message: {
      holder: SPENDER,
      spender: SPENDER,
      nonce: 0,
      expiry,
      allowed: true,
    },
  });
  const permitSingle = (
    expiration: unknown,
    sigDeadline: unknown
  ): TypedDataDocument => ({
    types: {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    },
    primaryType: 'PermitSingle',
    domain: { name: 'Permit2', chainId: 8453, verifyingContract: SPENDER },
    message: {
      details: { token: BASE_USDC, amount: '1', expiration, nonce: 0 },
      spender: SPENDER,
      sigDeadline,
    },
  });

  /** Every deadline the checker reads, as a document that is valid but for that value */
  const PRODUCERS: Array<
    [string, (value: unknown) => TypedDataDocument, ExpectedIntentSigning]
  > = [
    [
      'Permit deadline',
      (value) => withMessage(ZEROX_GASLESS_PERMIT, { deadline: value }),
      usdc,
    ],
    ['Permit expiry', daiPermit, usdc],
    [
      'Permit2 allowance expiration',
      (value) => permitSingle(value, NOW + 600),
      usdc,
    ],
    ['Permit2 sigDeadline', (value) => permitSingle(NOW + 600, value), usdc],
    [
      'Permit2 deadline',
      (value) => withMessage(ZEROX_GASLESS_TRADE, { deadline: value }),
      usdc,
    ],
    [
      'Authorization validBefore',
      (value) =>
        withMessage(RELAY_RECEIVE_WITH_AUTHORIZATION, { validBefore: value }),
      { ...usdc, maxSellAmount: new BigNumber('5000000') },
    ],
  ];
  const MALFORMED: Array<[string, unknown]> = [
    ['missing', undefined],
    ['hex', '0x10'],
    ['non-numeric', 'soon'],
    ['negative', -5],
    ['unsafe number', Number.MAX_SAFE_INTEGER + 2],
  ];

  it.each(PRODUCERS)(
    'control: a passed %s is the only problem and is expired',
    (label, build, exp) => {
      expect(findIntentTypedDataProblems(build(PAST), exp)).toEqual([
        {
          message: `${label} ${PAST} is not in the future (now ${NOW})`,
          expired: true,
        },
      ]);
    }
  );

  describe.each(PRODUCERS)('%s', (label, build, exp) => {
    it.each(MALFORMED)(
      'a %s value is a problem that is not expired',
      (_kind, value) => {
        expect(findIntentTypedDataProblems(build(value), exp)).toEqual([
          {
            message: `${label} ${String(value)} is not a valid deadline`,
            expired: false,
          },
        ]);
      }
    );
  });
});
