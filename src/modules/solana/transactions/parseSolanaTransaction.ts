import { baseToCommon } from 'src/shared/units/convert';
import type {
  Transaction,
  VersionedTransaction,
  MessageV0,
} from '@solana/web3.js';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { Action } from 'src/modules/zerion-api/requests/wallet-get-actions';
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

export const SOL_ASSET = {
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

export const SOL_ASSET_FUNGIBLE: Fungible = {
  id: '11111111111111111111111111111111',
  name: 'Solana',
  symbol: 'SOL',
  iconUrl:
    'https://token-icons.s3.amazonaws.com/11111111111111111111111111111111.png',
  verified: true,
  meta: {
    circulatingSupply: null,
    fullyDilutedValuation: null,
    marketCap: null,
    price: null,
    relativeChange1d: null,
    relativeChange30d: null,
    relativeChange365d: null,
    relativeChange90d: null,
    totalSupply: null,
  },
  new: false,
  implementations: {
    solana: {
      address: '11111111111111111111111111111111',
      decimals: 9,
    },
  },
};

export function parseSolanaTransaction(
  from: string,
  tx: Transaction | VersionedTransaction,
  currency: string
): Action {
  const timestamp = new Date().getTime();

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
  const hash = SolanaSigning.getTransactionSignature(tx);

  if (transferIx) {
    const toAddr = transferIx.keys[1].pubkey.toBase58();
    const lamports = parseLamports(transferIx);
    const content = {
      approvals: null,
      transfers: [
        {
          amount: {
            currency,
            value: null,
            usdValue: null,
            quantity: baseToCommon(
              lamports,
              SOL_ASSET.fungible.implementations.solana.decimals
            ).toFixed(),
          },
          direction: 'out' as const,
          fungible: {
            id: SOL_ASSET.fungible.id,
            name: SOL_ASSET.fungible.name,
            symbol: SOL_ASSET.fungible.symbol,
            iconUrl: SOL_ASSET.fungible.icon_url,
          },
          nft: null,
        },
      ],
    };

    const label = {
      title: 'to' as const,
      displayTitle: 'To',
      contract: null,
      wallet: {
        address: toAddr,
        name: toAddr,
        iconUrl: null,
      },
    };

    const type = { value: 'send' as const, displayValue: 'Send' };

    const transaction = {
      chain: {
        id: 'solana',
        name: 'Solana',
        iconUrl: '',
      },
      hash: hash ?? '<signature>',
      explorerUrl: hash ? `https://solscan.io/tx/${hash}` : null,
    };

    return {
      id: crypto.randomUUID(),
      timestamp,
      address: from,
      type,
      status: 'confirmed',
      transaction,
      label,
      fee: null,
      gasback: null,
      refund: null,
      content,
      acts: [
        {
          content,
          label,
          rate: null,
          status: 'confirmed',
          type,
          transaction,
        },
      ],
    };
  }

  // fallback
  return {
    id: crypto.randomUUID(),
    timestamp,
    address: from,
    type: { value: 'execute', displayValue: 'Execute' },
    transaction: {
      chain: {
        id: 'solana',
        name: 'Solana',
        iconUrl: '',
      },
      hash: hash ?? '<signature>',
      explorerUrl: hash ? `https://solscan.io/tx/${hash}` : null,
    },
    label: {
      title: 'application',
      displayTitle: 'Application',
      contract: {
        address: from,
        dapp: {
          id: from,
          name: from,
          url: null,
          iconUrl: null,
        },
      },
    },
    acts: [],
    content: null,
    fee: null,
    gasback: null,
    refund: null,
    status: 'confirmed',
  };
}
