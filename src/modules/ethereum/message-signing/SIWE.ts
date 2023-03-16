import { normalizeAddress } from 'src/shared/normalizeAddress';
import { toChecksumAddress } from '../toChecksumAddress';
import { toUtf8String } from './toUtf8String';

// https://eips.ethereum.org/EIPS/eip-4361
// https://docs.login.xyz/general-information/siwe-overview/eip-4361

/**
 * Checks if it looks like SIWE (Sign-in With Ethereum) message.
 */
export function isSiweLike(rawMessage: string) {
  // As suggested here: https://eips.ethereum.org/EIPS/eip-4361#verifying-message
  return toUtf8String(rawMessage).includes(
    'wants you to sign in with your Ethereum account'
  );
}

/**
 * Possible SIWE validation errors.
 */
export enum SiweValidationError {
  /** `domain` is not provided */
  missingDomain = 1 << 0,
  /** `domain` doesn't match the origin */
  domainMismatch = 1 << 1,
  /** `address` is not provided */
  missingAddress = 1 << 2,
  /** `address` does not conform to EIP-55 (not a checksum address) */
  invalidAddress = 1 << 3,
  /** The address in the signing data doesn’t match the address associated with your wallet */
  addressMismatch = 1 << 4,
  /** `URI` is not provided */
  missingURI = 1 << 5,
  /** 'Version' is not provided */
  missionVersion = 1 << 6,
  /** `Version` is not 1 */
  invalidVersion = 1 << 7,
  /** `Nonce` is not provided */
  missingNonce = 1 << 8,
  /** 'Chain ID' is not provided */
  missingChainId = 1 << 9,
  /** 'Issued At' is not provided */
  missingIssuedAt = 1 << 10,
  /** `Expiration Time` is present and in the past */
  expiredMessage = 1 << 11,
  /** `Not Before` is present and in the future */
  invalidNotBefore = 1 << 12,
  /** `Expiration Time`, `Not Before` or `Issued At` not complient to ISO-8601 */
  invalidTimeFormat = 1 << 13,
}

/**
 * EIP-4361 message.
 */
export class SiweMessage {
  private static readonly URI =
    '(([^:?#]+):)?(([^?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?';
  // ISO8601
  private static readonly DATETIME =
    '[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))';

  private static readonly DOMAIN =
    '(?<domain>([^?#]*)) wants you to sign in with your Ethereum account:';
  private static readonly ADDRESS = '\\n(?<address>0x[a-zA-Z0-9]{40})\\n\\n';
  private static readonly STATEMENT = '((?<statement>[^\\n]+)\\n)?';
  private static readonly URI_LINE = `\\nURI: (?<uri>${SiweMessage.URI}?)`;
  private static readonly VERSION = '\\nVersion: (?<version>1)';
  private static readonly CHAIN_ID = '\\nChain ID: (?<chainId>[0-9]+)';
  private static readonly NONCE = '\\nNonce: (?<nonce>[a-zA-Z0-9]{8,})';
  private static readonly ISSUED_AT = `\\nIssued At: (?<issuedAt>${SiweMessage.DATETIME})`;
  private static readonly EXPIRATION_TIME = `(\\nExpiration Time: (?<expirationTime>${SiweMessage.DATETIME}))?`;
  private static readonly NOT_BEFORE = `(\\nNot Before: (?<notBefore>${SiweMessage.DATETIME}))?`;

  private static readonly REQUEST_ID =
    "(\\nRequest ID: (?<requestId>[-._~!$&'()*+,;=:@%a-zA-Z0-9]*))?";
  private static readonly RESOURCES = `(\\nResources:(?<resources>(\\n- ${SiweMessage.URI}?)+))?`;

  private static readonly PATTERN = `\
^\
${SiweMessage.DOMAIN}\
${SiweMessage.ADDRESS}\
${SiweMessage.STATEMENT}\
${SiweMessage.URI_LINE}\
${SiweMessage.VERSION}\
${SiweMessage.CHAIN_ID}\
${SiweMessage.NONCE}\
${SiweMessage.ISSUED_AT}\
${SiweMessage.EXPIRATION_TIME}\
${SiweMessage.NOT_BEFORE}\
${SiweMessage.REQUEST_ID}\
${SiweMessage.RESOURCES}\
$\
`;

  readonly rawMessage: string;

  /**
   * The RFC 3986 authority that is requesting the signing
   */
  readonly domain: string;
  /**
   * The Ethereum address performing the signing conformant to
   * capitalization encoded checksum specified in EIP-55 where applicable
   */
  readonly address: string;
  /**
   * A human-readable ASCII assertion that the user will sign,
   * and it must not contain '\n' (the byte 0x0a)
   */
  readonly statement?: string;
  /**
   * An RFC 3986 URI referring to the resource that is
   * the subject of the signing (as in the subject of a claim)
   */
  readonly uri: string;
  /**
   * The current version of the message, which MUST be 1 for this specification
   */
  readonly version: string;
  /**
   * The EIP-155 Chain ID to which the session is bound,
   * and the network where Contract Accounts MUST be resolved
   */
  readonly chainId: number;
  /**
   * A randomized token typically chosen by the relying party and
   * used to prevent replay attacks, at least 8 alphanumeric characters
   */
  readonly nonce: string;
  /**
   * The ISO 8601 datetime string of the current time
   */
  readonly issuedAt: string;
  /**
   * The ISO 8601 datetime string that,
   * if present, indicates when the signed authentication message is no longer valid
   */
  readonly expirationTime?: string;
  /**
   * The ISO 8601 datetime string that, if present,
   * indicates when the signed authentication message will become valid
   */
  readonly notBefore?: string;
  /**
   * An system-specific identifier that may be used to uniquely refer to the sign-in request
   */
  readonly requestId?: string;
  /**
   * A list of information or references to information the user wishes to
   * have resolved as part of authentication by the relying party.
   * They are expressed as RFC 3986 URIs separated by "\n- " where \n is the byte 0x0a
   */
  readonly resources?: Array<string>;

  private error: SiweValidationError;

  private constructor(rawMessage: string, fields: Record<string, string>) {
    this.error = 0;
    this.rawMessage = rawMessage;

    this.domain = fields.domain;
    this.address = fields.address;
    this.statement = fields.statement;
    this.uri = fields.uri;
    this.version = fields.version;
    this.nonce = fields.nonce;
    this.chainId = parseInt(fields.chainId);
    this.issuedAt = fields.issuedAt;
    this.expirationTime = fields.expirationTime;
    this.notBefore = fields.notBefore;
    this.requestId = fields.requestId;
    this.resources = fields.resources?.split('\n- ').slice(1);
  }

  validate(origin: URL, walletAddress: string, currentTime: number) {
    const domain = this.domain.startsWith('http')
      ? new URL(this.domain)
      : new URL(`https://${this.domain}`);
    const originAuthority = `${origin.hostname}:${origin.port}`;
    const domainAuthority = `${domain.hostname}:${domain.port}`;

    if (domainAuthority !== originAuthority) {
      this.error |= SiweValidationError.domainMismatch;
    }
    if (!this.domain) {
      this.error |= SiweValidationError.missingDomain;
    }
    if (!this.address) {
      this.error |= SiweValidationError.missingAddress;
    }
    if (normalizeAddress(this.address) !== normalizeAddress(walletAddress)) {
      this.error |= SiweValidationError.addressMismatch;
    }
    if (this.address && this.address !== toChecksumAddress(this.address)) {
      this.error |= SiweValidationError.invalidAddress;
    }
    if (!this.nonce) {
      this.error |= SiweValidationError.missingNonce;
    }
    if (!this.chainId) {
      this.error |= SiweValidationError.missingChainId;
    }
    if (!this.version) {
      this.error |= SiweValidationError.missionVersion;
    }
    if (this.version !== '1') {
      this.error |= SiweValidationError.invalidVersion;
    }
    if (!this.uri) {
      this.error |= SiweValidationError.missingURI;
    }
    if (!this.issuedAt) {
      this.error |= SiweValidationError.missingIssuedAt;
    }

    if (
      this.expirationTime &&
      currentTime >= new Date(this.expirationTime).getTime()
    ) {
      this.error |= SiweValidationError.expiredMessage;
    }

    if (this.notBefore && currentTime < new Date(this.notBefore).getTime()) {
      this.error |= SiweValidationError.invalidNotBefore;
    }
  }

  isValid() {
    return this.error == 0;
  }

  hasError(error: SiweValidationError) {
    return this.error & error;
  }

  /**
   * Parses a Sign-In with Ethereum Message (EIP-4361) object from string.
   */
  public static parse(rawMessage: string) {
    const regExp = new RegExp(SiweMessage.PATTERN, 'g');
    const match = regExp.exec(rawMessage);
    return match?.groups ? new SiweMessage(rawMessage, match.groups) : null;
  }
}
