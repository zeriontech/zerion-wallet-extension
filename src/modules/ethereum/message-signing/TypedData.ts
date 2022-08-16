import type {
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';

export interface TypedData {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  primaryType?: string;
}
