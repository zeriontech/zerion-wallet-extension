import type {
  Transaction,
  VersionedTransaction,
  MessageV0,
} from '@solana/web3.js';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import type { AddressAction } from 'defi-sdk';
import { SolanaSigning } from '../signing';

function isSystemTransfer(ix: TransactionInstruction): boolean {
  return (
    ix.programId.equals(SystemProgram.programId) &&
    ix.data.length === 12 &&
    ix.data.readUInt32LE(0) === 2 // SystemProgram.transfer instruction code
  );
}

function parseLamports(ix: TransactionInstruction): number {
  return Number(ix.data.readBigUInt64LE(4));
}

const SOL_ASSET = {
  fungible: {
    id: 'sol',
    asset_code: '11111111111111111111111111111111',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    type: '',
    icon_url:
      'https://token-icons.s3.amazonaws.com/11111111111111111111111111111111.png',
    price: null,
    is_displayable: true,
    is_verified: true,
    implementations: {
      solana: {
        address: '11111111111111111111111111111111',
        decimals: 9,
      },
    },
  },
};

export function parseSolanaTransaction(
  from: string,
  tx: Transaction | VersionedTransaction
): AddressAction {
  const now = new Date().toISOString();

  const instructions =
    'version' in tx
      ? (tx.message as MessageV0).compiledInstructions.map((ix) => {
          return new TransactionInstruction({
            programId: tx.message.staticAccountKeys[ix.programIdIndex],
            keys: ix.accountKeyIndexes.map((idx) => ({
              pubkey: tx.message.staticAccountKeys[idx],
              isSigner: false,
              isWritable: true,
            })),
            data: Buffer.from(ix.data),
          });
        })
      : (tx as Transaction).instructions;

  const transferIx = instructions.find(isSystemTransfer);

  if (transferIx) {
    const toAddr = transferIx.keys[1].pubkey.toBase58();
    const lamports = parseLamports(transferIx);

    return {
      id: crypto.randomUUID(),
      datetime: now,
      address: from,
      type: { value: 'send', display_value: 'Send' },
      transaction: {
        chain: 'solana',
        hash: SolanaSigning.getTransactionSignature(tx) ?? '<signature>',
        status: 'confirmed',
        nonce: 0,
        sponsored: false,
        fee: null,
      },
      label: {
        type: 'to',
        value: toAddr,
        display_value: { wallet_address: toAddr },
      },
      content: {
        transfers: {
          outgoing: [
            {
              asset: SOL_ASSET,
              quantity: lamports.toString(),
              price: 0,
              recipient: toAddr,
            },
          ],
          incoming: [],
        },
      },
    };
  }

  // fallback
  return {
    id: crypto.randomUUID(),
    datetime: now,
    address: from,
    type: { value: 'execute', display_value: 'Execute' },
    transaction: {
      chain: 'solana',
      hash: tx.signatures?.[0]?.toString() ?? '',
      status: 'confirmed',
      nonce: 0,
      sponsored: false,
      fee: null,
    },
    label: {
      type: 'application',
      value: from,
      display_value: { contract_address: from },
    },
    content: {
      transfers: {
        outgoing: [],
        incoming: [],
      },
    },
  };
}
