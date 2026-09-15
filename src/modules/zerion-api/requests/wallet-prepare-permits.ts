import { HTTPError } from 'ky';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

/** EIP-712 typed data as issued by the backend; every domain field is nullable */
export interface IntentEVM {
  /** Dictionary with type name as key, list of component types as value */
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
  primaryType: string;
  domain: {
    name: null | string;
    verifyingContract: null | string;
    /** Salt value as hex string (32 bytes) */
    salt: null | string;
    version: null | string;
    /** Chain ID, encoded as a hex string */
    chainId: null | string;
  };
  message: {
    [key: string]: unknown;
  };
}

/** A decryption permit the wallet owner has to sign, one per chain */
export interface Permit {
  /** Chain the permit covers, in Zerion's chain vocabulary */
  chain: string;
  /** EIP-712 payload to sign verbatim; needed only at signing time */
  eip712: IntentEVM;
  /** Opaque round-trip data: echo verbatim in the SignedPermit */
  contracts: string[];
  /** ISO date-time when the permit stops being accepted; opaque round-trip data */
  expireAt: string;
}

/** A signed permit as attached to positions / portfolio / actions requests */
export interface SignedPermit {
  /** Wallet address this permit was issued for */
  address: string;
  /** The `contracts` field from the Permit this signature covers */
  contracts: string[];
  /** The `expireAt` field from the Permit this signature covers */
  expireAt: string;
  /** ECDSA signature over the issued eip712 payload ("0x" + 130 hex chars) */
  signature: string;
}

export interface Params {
  /** Wallet address to issue permits for */
  address: string;
}

type Response = ResponseBody<{ permits: Permit[] }>;

export async function walletPreparePermits(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
): Promise<Response> {
  const provider = await this.getAddressProviderHeader(params.address);
  const kyOptions = this.getKyOptions();
  try {
    return await ZerionHttpClient.post<Response>(
      {
        endpoint: 'wallet/prepare-permits/v1',
        body: JSON.stringify(params),
        headers: { 'Zerion-Wallet-Provider': provider },
        ...options,
      },
      { ...kyOptions, retry: 0 }
    );
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }
    // An empty 200 body (the endpoint before it went live) means "no permits"
    if (error instanceof SyntaxError) {
      return { data: { permits: [] }, errors: undefined };
    }
    throw error;
  }
}
