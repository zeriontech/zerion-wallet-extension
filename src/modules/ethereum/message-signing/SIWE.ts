export interface MessageFields {
  readonly domain: string;
  readonly address: string;
  readonly statement?: string;
  readonly uri: string;
  readonly version: string;
  readonly chainId: number;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expirationTime?: string;
  readonly notBefore?: string;
  readonly requestId?: string;
  readonly resources?: Array<string>;
}

/**
 * EIP-4361 message.
 */
export class Message implements MessageFields {
  private static readonly DOMAIN =
    '(?<domain>([^?#]*)) wants you to sign in with your Ethereum account:';
  private static readonly ADDRESS = '\\n(?<address>0x[a-zA-Z0-9]{40})\\n\\n';
  private static readonly STATEMENT = '((?<statement>[^\\n]+)\\n)?';
  private static readonly URI =
    '(([^:?#]+):)?(([^?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?';
  private static readonly URI_LINE = `\\nURI: (?<uri>${Message.URI}?)`;
  private static readonly VERSION = '\\nVersion: (?<version>1)';
  private static readonly CHAIN_ID = '\\nChain ID: (?<chainId>[0-9]+)';
  private static readonly NONCE = '\\nNonce: (?<nonce>[a-zA-Z0-9]{8,})';
  private static readonly DATETIME = `[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))`;
  private static readonly ISSUED_AT = `\\nIssued At: (?<issuedAt>${Message.DATETIME})`;
  private static readonly EXPIRATION_TIME = `(\\nExpiration Time: (?<expirationTime>${Message.DATETIME}))?`;
  private static readonly NOT_BEFORE = `(\\nNot Before: (?<notBefore>${Message.DATETIME}))?`;
  private static readonly REQUEST_ID =
    "(\\nRequest ID: (?<requestId>[-._~!$&'()*+,;=:@%a-zA-Z0-9]*))?";
  private static readonly RESOURCES = `(\\nResources:(?<resources>(\\n- ${Message.URI}?)+))?`;

  private static readonly PATTERN = `\
^\
${Message.DOMAIN}\
${Message.ADDRESS}\
${Message.STATEMENT}\
${Message.URI_LINE}\
${Message.VERSION}\
${Message.CHAIN_ID}\
${Message.NONCE}\
${Message.ISSUED_AT}\
${Message.EXPIRATION_TIME}\
${Message.NOT_BEFORE}\
${Message.REQUEST_ID}\
${Message.RESOURCES}\
$\
`;

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

  private constructor(match: Record<string, string>) {
    if (match.domain.length === 0 || !/[^#?]*/.test(match.domain)) {
      throw new Error('"Domain" cannot be empty.');
    }
    if (!match.address) {
      throw new Error('"Address" cannot be empty');
    }
    if (!match.nonce) {
      throw new Error('"Nonce" cannot be empty');
    }
    if (!match.chainId) {
      throw new Error('"Chain ID" cannot be empty');
    }
    if (!match.version) {
      throw new Error('"Version" cannot be empty');
    }
    if (!match.uri) {
      throw new Error('"URI" cannot be empty');
    }
    if (!match.issuedAt) {
      throw new Error('"Issued At" cannot be empty');
    }

    this.domain = match.domain;
    this.address = match.address;
    this.statement = match.statement;
    this.uri = match.uri;
    this.version = match.version;
    this.nonce = match.nonce;
    this.chainId = parseInt(match.chainId);
    this.issuedAt = match.issuedAt;
    this.expirationTime = match.expirationTime;
    this.notBefore = match.notBefore;
    this.requestId = match.requestId;
    this.resources = match.resources?.split('\n- ').slice(1);
  }

  public static parse(rawMessage: string) {
    const REGEX = new RegExp(Message.PATTERN, 'g');
    const match = REGEX.exec(rawMessage);
    if (!match?.groups) {
      throw new Error('Message did not match the regular expression.');
    }
    return new Message(match.groups);
  }
}
