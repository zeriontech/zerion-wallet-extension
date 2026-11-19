import { PublicKey, SystemProgram, TransactionInstruction, type Connection } from '@solana/web3.js';

/** SPL Token program id. */
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
/** SPL Associated Token Account program id. */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

/** Derive the associated token account for `owner` and `mint`. */
export function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

export function createTransferInstruction({
  source,
  destination,
  owner,
  amount,
}: {
  source: PublicKey;
  destination: PublicKey;
  owner: PublicKey;
  amount: bigint;
}): TransactionInstruction {
  // SPL Token Transfer instruction: u8 tag 3 followed by a little-endian u64.
  const data = new Uint8Array(9);
  data[0] = 3;
  new DataView(data.buffer).setBigUint64(1, amount, true);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export function createAssociatedTokenAccountInstruction({
  payer,
  associatedToken,
  owner,
  mint,
}: {
  payer: PublicKey;
  associatedToken: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([]),
  });
}

/**
 * Read the decimals field from an SPL mint account.
 * Mint layout: mintAuthorityOption (4) + mintAuthority (32) + supply (8),
 * then decimals at offset 44.
 */
export async function getMintDecimals(connection: Connection, mint: PublicKey): Promise<number> {
  const account = await connection.getAccountInfo(mint);
  if (!account) {
    throw new Error('Mint account not found');
  }
  if (!account.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error('Account is not an SPL token mint');
  }
  if (account.data.length < 45) {
    throw new Error('Invalid SPL token mint account');
  }
  return account.data[44];
}
