import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from './splToken';

const source = new PublicKey('4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS');
const destination = new PublicKey('11111111111111111111111111111111');
const mint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

describe('SPL token instructions', () => {
  test('encodes a transfer instruction', () => {
    const amount = 123456789n;
    const instruction = createTransferInstruction({
      source,
      destination,
      owner: source,
      amount,
    });

    expect(instruction.programId.equals(TOKEN_PROGRAM_ID)).toBe(true);
    expect(instruction.data[0]).toBe(3);
    expect(
      new DataView(instruction.data.buffer, instruction.data.byteOffset).getBigUint64(1, true),
    ).toBe(amount);
    expect(instruction.keys.map((key) => key.pubkey.toBase58())).toEqual([
      source.toBase58(),
      destination.toBase58(),
      source.toBase58(),
    ]);
  });

  test('encodes an associated token account instruction', () => {
    const instruction = createAssociatedTokenAccountInstruction({
      payer: source,
      associatedToken: destination,
      owner: source,
      mint,
    });

    expect(instruction.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).toBe(true);
    expect(instruction.data.length).toBe(0);
    expect(instruction.keys.map((key) => key.pubkey.toBase58())).toEqual([
      source.toBase58(),
      destination.toBase58(),
      source.toBase58(),
      mint.toBase58(),
      SystemProgram.programId.toBase58(),
      TOKEN_PROGRAM_ID.toBase58(),
    ]);
  });
});
