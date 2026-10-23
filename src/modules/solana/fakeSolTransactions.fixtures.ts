import {
  AddressLookupTableAccount,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import type { PublicKey } from '@solana/web3.js';
import type { StringBase64 } from 'src/shared/types/StringBase64';

const USER_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(1));
const JUPITER_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(2));

export const USER = USER_KEYPAIR.publicKey;
export const JUPITER = JUPITER_KEYPAIR.publicKey;
export const STRANGER = Keypair.fromSeed(new Uint8Array(32).fill(3)).publicKey;
export const RECIPIENT = Keypair.fromSeed(new Uint8Array(32).fill(4)).publicKey;

const BLOCKHASH = Keypair.fromSeed(new Uint8Array(32).fill(5)).publicKey;
const EMPTY_SIGNATURE = new Uint8Array(64);

const LOOKUP_TABLE = new AddressLookupTableAccount({
  key: Keypair.fromSeed(new Uint8Array(32).fill(6)).publicKey,
  state: {
    deactivationSlot: BigInt('18446744073709551615'),
    lastExtendedSlot: 0,
    lastExtendedSlotStartIndex: 0,
    addresses: [RECIPIENT],
  },
});

export const LOOKUP_TABLE_KEY = LOOKUP_TABLE.key;

export type FakeSolTransactionKind = 'legacy' | 'v0' | 'v0-lookup-table';

type Keys = { payer: PublicKey; owner: PublicKey; recipient?: PublicKey };

function transferFrom(owner: PublicKey, recipient = RECIPIENT) {
  return SystemProgram.transfer({
    fromPubkey: owner,
    toPubkey: recipient,
    lamports: 1000,
  });
}

function fakeLegacyTransaction({ payer, owner, recipient }: Keys) {
  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: BLOCKHASH.toBase58(),
  }).add(transferFrom(owner, recipient));
  if (payer.equals(JUPITER)) {
    transaction.partialSign(JUPITER_KEYPAIR);
  }
  const serialized = transaction.serialize({ requireAllSignatures: false });
  const userSigned = Transaction.from(serialized);
  if (owner.equals(USER)) {
    userSigned.partialSign(USER_KEYPAIR);
  }
  const userSignature = userSigned.signatures.find(({ publicKey }) =>
    publicKey.equals(USER)
  )?.signature;
  return {
    serialized,
    userSignature,
    userSigned: userSigned.serialize({ requireAllSignatures: false }),
  };
}

function fakeVersionedTransaction(
  { payer, owner, recipient }: Keys,
  lookupTables: AddressLookupTableAccount[]
) {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: BLOCKHASH.toBase58(),
    instructions: [transferFrom(owner, recipient)],
  }).compileToV0Message(lookupTables);
  const transaction = new VersionedTransaction(message);
  if (payer.equals(JUPITER)) {
    transaction.sign([JUPITER_KEYPAIR]);
  }
  const serialized = transaction.serialize();
  const userSigned = VersionedTransaction.deserialize(serialized);
  if (owner.equals(USER)) {
    userSigned.sign([USER_KEYPAIR]);
  }
  const userIndex = message.staticAccountKeys.findIndex((key) =>
    key.equals(USER)
  );
  const userSignature =
    userIndex >= 0 && userIndex < message.header.numRequiredSignatures
      ? userSigned.signatures[userIndex]
      : undefined;
  return { serialized, userSignature, userSigned: userSigned.serialize() };
}

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64') as StringBase64;
}

export function fakeSolTransaction(
  kind: FakeSolTransactionKind,
  keys: Keys
): {
  transaction: StringBase64;
  userSignature: Uint8Array;
  userSignedTransaction: StringBase64;
} {
  const { serialized, userSignature, userSigned } =
    kind === 'legacy'
      ? fakeLegacyTransaction(keys)
      : fakeVersionedTransaction(
          keys,
          kind === 'v0-lookup-table' ? [LOOKUP_TABLE] : []
        );
  return {
    transaction: toBase64(serialized),
    userSignature: new Uint8Array(userSignature ?? EMPTY_SIGNATURE),
    userSignedTransaction: toBase64(userSigned),
  };
}

export function readSigned(
  kind: FakeSolTransactionKind,
  signed: StringBase64
): {
  signers: string[];
  signatures: Uint8Array[];
  staticKeys: string[];
  lookupTables: string[];
} {
  const bytes = Buffer.from(signed, 'base64');
  if (kind === 'legacy') {
    const transaction = Transaction.from(bytes);
    const { accountKeys } = transaction.compileMessage();
    return {
      signers: transaction.signatures.map(({ publicKey }) =>
        publicKey.toBase58()
      ),
      signatures: transaction.signatures.map(
        ({ signature }) => new Uint8Array(signature ?? EMPTY_SIGNATURE)
      ),
      staticKeys: accountKeys.map((key) => key.toBase58()),
      lookupTables: [],
    };
  }
  const { message, signatures } = VersionedTransaction.deserialize(bytes);
  return {
    signers: message.staticAccountKeys
      .slice(0, message.header.numRequiredSignatures)
      .map((key) => key.toBase58()),
    signatures: signatures.map((signature) => new Uint8Array(signature)),
    staticKeys: message.staticAccountKeys.map((key) => key.toBase58()),
    lookupTables: message.addressTableLookups.map(({ accountKey }) =>
      accountKey.toBase58()
    ),
  };
}
