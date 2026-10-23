import BigNumber from 'bignumber.js';
import type { TypedDataDocument } from 'src/shared/types/Quote';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';

/**
 * Provider-agnostic checks of a backend EIP-712 document before the wallet
 * prompt (WLT-2885): it is well formed, it is for the chain the quote executes
 * on, and the standard token-permission primitives (EIP-2612 and DAI Permit,
 * Permit2 SignatureTransfer and AllowanceTransfer, EIP-3009, an ERC-20 approve
 * meta-transaction) cover only the sell token, before a future deadline; the
 * ones that transfer an exact amount move no more than the quoted input. Any
 * other schema is allowed after the first two checks.
 *
 * Not verified client-side: the spender or settlement contract, and the order
 * payload (a Permit2 witness, a provider's order struct) — those are trusted
 * from the backend.
 */

/** What the user is executing, in the units and addresses a signed document uses */
export interface ExpectedIntentSigning {
  chainId: number | null;
  /** Lowercased address, `native`, or null when the asset has no implementation on the chain */
  sellToken: string | null;
  /** The quoted input amount in base units; may be fractional */
  maxSellAmount: BigNumber | null;
  nowSeconds: number;
}

const NATIVE = 'native';
const NATIVE_SENTINELS = new Set([
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
]);
const ERC20_APPROVE_SELECTOR = '0x095ea7b3';

/** The EIP712Domain field types `prepareTypedDataForSigning` declares, by name */
const DOMAIN_FIELD_TYPES: Record<string, string> = {
  name: 'string',
  version: 'string',
  chainId: 'uint256',
  verifyingContract: 'address',
  salt: 'bytes32',
};

const PERMIT2_TYPES = new Set([
  'PermitTransferFrom',
  'PermitWitnessTransferFrom',
  'PermitBatchTransferFrom',
  'PermitBatchWitnessTransferFrom',
]);
const PERMIT2_ALLOWANCE_TYPES = new Set(['PermitSingle', 'PermitBatch']);
const EIP3009_TYPES = new Set([
  'ReceiveWithAuthorization',
  'TransferWithAuthorization',
]);

/**
 * A form amount as the amount field writes it: digits with at most one point
 * and at least one digit (`1.`, `.5`, `01` included); null for anything else
 */
function parseFormAmount(value: string): BigNumber | null {
  const [integer, fraction = '', ...rest] = value.split('.');
  if (
    rest.length > 0 ||
    !/^\d*$/.test(integer) ||
    !/^\d*$/.test(fraction) ||
    integer.length + fraction.length === 0
  ) {
    return null;
  }
  return new BigNumber(`${integer || '0'}.${fraction || '0'}`);
}

export function buildExpectedIntentSigning({
  inputAmount,
  inputNetwork,
  inputFungible,
  nowSeconds,
}: {
  inputAmount: string;
  inputNetwork: NetworkInfo;
  inputFungible: Fungible;
  nowSeconds: number;
}): ExpectedIntentSigning {
  const implementation =
    inputFungible.implementations?.[inputNetwork.id] ?? null;
  const amount = parseFormAmount(inputAmount);
  return {
    chainId: inputNetwork.specification.eip155?.chainId ?? null,
    sellToken: implementation
      ? implementation.address?.toLowerCase() ?? NATIVE
      : null,
    maxSellAmount:
      implementation && amount
        ? amount.shiftedBy(implementation.decimals)
        : null,
    nowSeconds,
  };
}

type Message = Record<string, unknown>;

/** Why a document must not be signed; `expired` when it only ran past one of its own deadlines */
export interface IntentTypedDataProblem {
  message: string;
  expired: boolean;
}

/** Built only from a parsed deadline, so a malformed value can never read as expired */
class ExpiredDeadline {
  readonly message: string;

  constructor(label: string, deadline: BigNumber, nowSeconds: number) {
    this.message = `${label} ${deadline.toFixed()} is not in the future (now ${nowSeconds})`;
  }
}

function objectValue(value: unknown): Message | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Message)
    : null;
}

function uintValue(value: unknown): BigNumber | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0
      ? new BigNumber(value)
      : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return new BigNumber(value);
  }
  return null;
}

/** A token address, with the native-currency sentinels read as `native` */
function tokenValue(value: unknown): string | null {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return null;
  }
  const address = value.toLowerCase();
  return NATIVE_SENTINELS.has(address) ? NATIVE : address;
}

/** The chain id the signer will use: a number, or a decimal or hex string */
function chainIdValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null;
  }
  if (typeof value === 'string' && /^(\d+|0x[0-9a-fA-F]+)$/.test(value)) {
    const chainId = Number(value);
    return Number.isSafeInteger(chainId) ? chainId : null;
  }
  return null;
}

function parseMessage(message: unknown): Message | null {
  if (typeof message !== 'string') {
    return objectValue(message);
  }
  try {
    return objectValue(JSON.parse(message));
  } catch {
    return null;
  }
}

function fieldNames(document: TypedDataDocument, type: string): string[] {
  const fields = document.types?.[type];
  return Array.isArray(fields) ? fields.map((field) => field?.name) : [];
}

function domainProblems(document: TypedDataDocument): string[] {
  const domain = objectValue(document.domain);
  if (!domain) {
    return ['domain is not an object'];
  }
  const unknown = Object.keys(domain).filter(
    (key) => !(key in DOMAIN_FIELD_TYPES)
  );
  if (unknown.length > 0) {
    return [`domain has unsupported fields: ${unknown.join(', ')}`];
  }
  const declared = document.types?.EIP712Domain;
  if (!declared) {
    return [];
  }
  const setFields = Object.keys(DOMAIN_FIELD_TYPES).filter(
    (name) => domain[name] != null && domain[name] !== ''
  );
  const declaredFields = Array.isArray(declared)
    ? declared.map((field) => `${field?.name} ${field?.type}`)
    : [];
  const expected = setFields.map(
    (name) => `${name} ${DOMAIN_FIELD_TYPES[name]}`
  );
  const same =
    declaredFields.length === expected.length &&
    expected.every((field) => declaredFields.includes(field));
  return same
    ? []
    : [
        `EIP712Domain declares ${
          declaredFields.join(', ') || 'nothing'
        } but the domain sets ${setFields.join(', ') || 'nothing'}`,
      ];
}

function deadlineProblem(
  label: string,
  value: unknown,
  nowSeconds: number
): string | ExpiredDeadline | null {
  const deadline = uintValue(value);
  if (deadline === null) {
    return `${label} ${String(value)} is not a valid deadline`;
  }
  return deadline.isGreaterThan(nowSeconds)
    ? null
    : new ExpiredDeadline(label, deadline, nowSeconds);
}

function tokenProblem(
  label: string,
  value: unknown,
  expected: ExpectedIntentSigning
): string | null {
  const token = tokenValue(value);
  return token !== null && token === expected.sellToken
    ? null
    : `${label} ${String(value)} is not the sell token ${
        expected.sellToken ?? 'unknown'
      }`;
}

function amountProblem(
  label: string,
  amount: BigNumber | null,
  expected: ExpectedIntentSigning
): string | null {
  return amount !== null &&
    expected.maxSellAmount !== null &&
    amount.isLessThanOrEqualTo(expected.maxSellAmount)
    ? null
    : `${label} ${amount?.toFixed() ?? 'invalid'} exceeds the quoted input ${
        expected.maxSellAmount?.toFixed() ?? 'unknown'
      }`;
}

/** EIP-2612: the token and deadline; the allowance is often unlimited by design */
function permitProblems(
  document: TypedDataDocument,
  message: Message,
  expected: ExpectedIntentSigning
) {
  return [
    tokenProblem('Permit token', document.domain.verifyingContract, expected),
    deadlineProblem('Permit deadline', message.deadline, expected.nowSeconds),
  ];
}

/** DAI-style Permit: the token and expiry, where 0 means no expiry; `allowed` is not checked */
function daiPermitProblems(
  document: TypedDataDocument,
  message: Message,
  expected: ExpectedIntentSigning
) {
  return [
    tokenProblem('Permit token', document.domain.verifyingContract, expected),
    uintValue(message.expiry)?.isZero()
      ? null
      : deadlineProblem('Permit expiry', message.expiry, expected.nowSeconds),
  ];
}

/** Permit2 AllowanceTransfer: the tokens and expirations; the allowance is often unlimited by design */
function permit2AllowanceProblems(
  message: Message,
  expected: ExpectedIntentSigning
) {
  const details = Array.isArray(message.details)
    ? message.details.map(objectValue)
    : [objectValue(message.details)];
  return [
    ...(details.length === 0
      ? ['Permit2 allowance covers no token']
      : details.flatMap((entry) => [
          tokenProblem('Permit2 allowance token', entry?.token, expected),
          deadlineProblem(
            'Permit2 allowance expiration',
            entry?.expiration,
            expected.nowSeconds
          ),
        ])),
    deadlineProblem(
      'Permit2 sigDeadline',
      message.sigDeadline,
      expected.nowSeconds
    ),
  ];
}

function permit2Problems(message: Message, expected: ExpectedIntentSigning) {
  const permitted = Array.isArray(message.permitted)
    ? message.permitted.map(objectValue)
    : [objectValue(message.permitted)];
  const amounts = permitted.map((entry) => uintValue(entry?.amount));
  return [
    ...(permitted.length === 0
      ? ['Permit2 permits no token']
      : permitted.map((entry) =>
          tokenProblem('Permit2 token', entry?.token, expected)
        )),
    amountProblem(
      'Permit2 amount',
      amounts.every((amount) => amount !== null) && amounts.length > 0
        ? BigNumber.sum(...(amounts as BigNumber[]))
        : null,
      expected
    ),
    deadlineProblem('Permit2 deadline', message.deadline, expected.nowSeconds),
  ];
}

function eip3009Problems(
  document: TypedDataDocument,
  message: Message,
  expected: ExpectedIntentSigning
) {
  return [
    tokenProblem(
      'Authorization token',
      document.domain.verifyingContract,
      expected
    ),
    amountProblem('Authorization value', uintValue(message.value), expected),
    deadlineProblem(
      'Authorization validBefore',
      message.validBefore,
      expected.nowSeconds
    ),
  ];
}

/** A meta-transaction may only carry ERC-20 `approve(spender, amount)` of the sell token */
function metaTransactionProblems(
  document: TypedDataDocument,
  message: Message,
  expected: ExpectedIntentSigning
) {
  const call = message.functionSignature;
  const isApprove =
    typeof call === 'string' &&
    /^0x[0-9a-fA-F]{136}$/.test(call) &&
    call.slice(0, 10).toLowerCase() === ERC20_APPROVE_SELECTOR;
  return [
    isApprove
      ? null
      : `MetaTransaction calls ${
          typeof call === 'string' ? call.slice(0, 10) : 'nothing'
        }, not ERC-20 approve`,
    tokenProblem(
      'MetaTransaction token',
      document.domain.verifyingContract,
      expected
    ),
  ];
}

function collectProblems(
  document: TypedDataDocument,
  expected: ExpectedIntentSigning
): Array<string | ExpiredDeadline | null> {
  const types = objectValue(document.types);
  const primaryType = document.primaryType;
  if (
    !types ||
    typeof primaryType !== 'string' ||
    !Array.isArray(types[primaryType])
  ) {
    return [`primaryType ${String(primaryType)} is not declared in types`];
  }
  const message = parseMessage(document.message);
  if (!message) {
    return ['message is not an object'];
  }
  const problems: Array<string | ExpiredDeadline | null> =
    domainProblems(document);
  if (problems.length > 0) {
    return problems;
  }

  const { chainId } = document.domain;
  if (chainId != null) {
    const signedChainId = chainIdValue(chainId);
    problems.push(
      signedChainId !== null && signedChainId === expected.chainId
        ? null
        : `domain chainId ${String(chainId)} is not the input chain ${
            expected.chainId ?? 'unknown'
          }`
    );
  }

  const fields = fieldNames(document, primaryType);
  if (
    primaryType === 'Permit' &&
    ['owner', 'spender', 'value', 'nonce', 'deadline'].every((name) =>
      fields.includes(name)
    )
  ) {
    problems.push(...permitProblems(document, message, expected));
  } else if (
    primaryType === 'Permit' &&
    ['holder', 'spender', 'nonce', 'expiry', 'allowed'].every((name) =>
      fields.includes(name)
    )
  ) {
    problems.push(...daiPermitProblems(document, message, expected));
  } else if (
    PERMIT2_ALLOWANCE_TYPES.has(primaryType) &&
    fields.includes('details')
  ) {
    problems.push(...permit2AllowanceProblems(message, expected));
  } else if (PERMIT2_TYPES.has(primaryType) && fields.includes('permitted')) {
    problems.push(...permit2Problems(message, expected));
  } else if (EIP3009_TYPES.has(primaryType)) {
    problems.push(...eip3009Problems(document, message, expected));
  } else if (
    primaryType === 'MetaTransaction' &&
    fields.includes('functionSignature')
  ) {
    problems.push(...metaTransactionProblems(document, message, expected));
  }
  return problems;
}

/**
 * Why `document` must not be signed for the trade in `expected`, each problem
 * marked as an expired deadline or not; empty when it may be.
 */
export function findIntentTypedDataProblems(
  document: TypedDataDocument,
  expected: ExpectedIntentSigning
): IntentTypedDataProblem[] {
  return collectProblems(document, expected)
    .filter((problem) => problem !== null)
    .map((problem) =>
      problem instanceof ExpiredDeadline
        ? { message: problem.message, expired: true }
        : { message: problem, expired: false }
    );
}
