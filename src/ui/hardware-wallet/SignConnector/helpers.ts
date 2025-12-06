import type { TransportIdentifier } from '@zeriontech/hardware-wallet-connection';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';
import type { StringBase64 } from 'src/shared/types/StringBase64';

interface PersonalSignParams {
  derivationPath: string;
  message: string;
}

export function assertPersonalSignParams(
  x: unknown
): asserts x is PersonalSignParams {
  invariant(
    isObj(x) &&
      typeof x.derivationPath === 'string' &&
      typeof x.message === 'string',
    'Invalid Payload'
  );
}

interface SignTypedData_v4Params {
  derivationPath: string;
  typedData: string | TypedData;
}

export function assertSignTypedData_v4Params(
  x: unknown
): asserts x is SignTypedData_v4Params {
  invariant(
    isObj(x) &&
      typeof x.derivationPath === 'string' &&
      // TODO: should we add more accurate check for typedData inner structure
      (typeof x.typedData === 'string' || isObj(x.typedData)),
    'Invalid Payload'
  );
}

interface SignTransactionParams {
  derivationPath: string;
  transaction: object;
  transport: TransportIdentifier;
}

export function assertSignTransactionParams(
  x: unknown
): asserts x is SignTransactionParams {
  invariant(
    isObj(x) && typeof x.derivationPath === 'string' && isObj(x.transaction),
    'Invalid Payload'
  );
}

interface SignSolanaTransactionParams {
  derivationPath: string;
  transaction: StringBase64;
}

export function assertSignSolanaTransactionParams(
  x: unknown
): asserts x is SignSolanaTransactionParams {
  invariant(
    isObj(x) &&
      typeof x.derivationPath === 'string' &&
      typeof x.transaction === 'string',
    'Invalid Payload'
  );
}
