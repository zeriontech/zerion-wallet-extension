import type {
  Transaction,
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';
import type { Asset, AddressAction } from 'defi-sdk';

interface InstructionKey {
  pubkey: PublicKey;
  isSigner: boolean;
}

interface TransactionInstruction {
  programId: PublicKey;
  keys: InstructionKey[];
  data: Uint8Array;
}

function getTransactionHash(
  transaction: Transaction | VersionedTransaction
): string {
  if ('version' in transaction) {
    const signature = transaction.signatures[0];
    if (!signature) return '11111111111111111111111111111111';
    return bs58.encode(signature);
  } else {
    return (
      transaction.signatures[0]?.publicKey.toBase58() ||
      '11111111111111111111111111111111'
    );
  }
}

function extractTransactionDetails(
  transaction: Transaction | VersionedTransaction
): {
  feePayer: PublicKey | undefined;
  instructions: TransactionInstruction[];
} {
  if ('version' in transaction) {
    return {
      feePayer: transaction.message.staticAccountKeys[0],
      instructions: transaction.message.compiledInstructions.map(
        (instruction) => ({
          programId:
            transaction.message.staticAccountKeys[instruction.programIdIndex],
          keys: instruction.accountKeyIndexes.map((index) => ({
            pubkey: transaction.message.staticAccountKeys[index],
            isSigner: transaction.message.isAccountSigner(index),
          })),
          data: instruction.data,
        })
      ),
    };
  }
  return {
    feePayer: transaction.feePayer,
    instructions: transaction.instructions,
  };
}

function parseInstructionAmount(instruction: TransactionInstruction): string {
  if (!instruction.data || instruction.data.length === 0) {
    return '0';
  }

  try {
    const amountLamports = Array.from(instruction.data)
      .slice(4)
      .reduce(
        (acc: number, val: number, idx: number) =>
          acc + val * Math.pow(256, idx),
        0
      );
    return amountLamports.toFixed();
  } catch {
    return '0';
  }
}

interface ParsedInstructions {
  recipient: PublicKey | null;
  sender: PublicKey | null;
  actionType: 'send' | 'execute';
  quantity: string;
  programId: PublicKey | null;
}

function parseInstructions(
  instructions: TransactionInstruction[]
): ParsedInstructions {
  if (!instructions || instructions.length === 0) {
    return {
      recipient: null,
      sender: null,
      actionType: 'execute',
      quantity: '0',
      programId: null,
    };
  }

  const firstInstruction = instructions[0];
  const signer =
    firstInstruction.keys.find((key) => key.isSigner)?.pubkey || null;
  const recipient =
    firstInstruction.keys.find((key) => !key.isSigner)?.pubkey || null;
  const programId = firstInstruction.programId;

  const quantity = parseInstructionAmount(firstInstruction);
  const actionType = recipient ? 'send' : 'execute';

  return {
    recipient,
    sender: signer,
    actionType,
    quantity,
    programId,
  };
}

interface TransactionLabel {
  type: 'to' | 'contract';
  value: string;
  display_value: {
    wallet_address?: string;
    contract_address?: string;
  };
}

function getTransactionLabel(
  actionType: 'send' | 'execute',
  recipientStr: string | undefined,
  programId: PublicKey | null
): TransactionLabel | null {
  if (actionType === 'send' && recipientStr) {
    return {
      type: 'to',
      value: recipientStr,
      display_value: { wallet_address: recipientStr },
    };
  }

  if (actionType === 'execute' && programId) {
    const programIdStr = programId.toBase58();
    return {
      type: 'contract',
      value: programIdStr,
      display_value: { contract_address: programIdStr },
    };
  }

  return null;
}

function getTransactionContent(
  actionType: 'send' | 'execute',
  recipientStr: string | undefined,
  addressStr: string | undefined,
  sender: PublicKey | null,
  solAsset: Asset,
  quantity: string
): AddressAction['content'] {
  if (actionType === 'send' && recipientStr) {
    return {
      transfers: {
        outgoing: [
          {
            asset: { fungible: solAsset },
            quantity,
            price: null,
            recipient: recipientStr !== addressStr ? recipientStr : null,
            sender:
              sender?.toBase58() !== addressStr ? sender?.toBase58() : null,
          },
        ],
      },
    };
  }

  return null;
}

export function solanaTransactionToAddressAction(
  transaction: Transaction | VersionedTransaction,
  from: string
): AddressAction {
  try {
    const transactionHash = getTransactionHash(transaction);
    const blockTime = null;
    const { feePayer, instructions } = extractTransactionDetails(transaction);
    const address = feePayer || null;
    const addressStr = address?.toBase58();

    const solAsset: Asset = {
      id: 'solana',
      asset_code: 'SOL',
      decimals: 9,
      icon_url: 'https://token-icons.s3.us-east-1.amazonaws.com/solana.png',
      name: 'Solana',
      price: null,
      symbol: 'SOL',
      type: 'asset',
      is_displayable: true,
      is_verified: true,
    };

    const { recipient, sender, actionType, quantity, programId } =
      parseInstructions(instructions);
    const recipientStr = recipient?.toBase58();

    return {
      id: transactionHash,
      datetime: blockTime
        ? new Date(blockTime * 1000).toISOString()
        : new Date().toISOString(),
      address: addressStr ?? from,
      type: {
        value: actionType,
        display_value: actionType.charAt(0).toUpperCase() + actionType.slice(1),
      },
      transaction: {
        chain: 'solana',
        hash: transactionHash,
        status: 'pending',
        nonce: 0,
        sponsored: false,
        fee: null,
        gasback: null,
      },
      label: getTransactionLabel(actionType, recipientStr, programId),
      content: getTransactionContent(
        actionType,
        recipientStr,
        addressStr,
        sender,
        solAsset,
        quantity
      ),
    };
  } catch (error) {
    const fallbackHash = getTransactionHash(transaction);
    return {
      id: fallbackHash,
      address: from,
      content: null,
      datetime: new Date().toISOString(),
      label: {
        type: 'contract',
        display_value: {
          contract_address: '11111111111111111111111111111111',
        },
        value: '11111111111111111111111111111111',
      },
      transaction: {
        chain: 'solana',
        hash: fallbackHash,
        status: 'pending',
        nonce: 0,
        sponsored: false,
        fee: null,
        gasback: null,
      },
      type: {
        value: 'execute',
        display_value: 'Execute',
      },
    };
  }
}

// /**
//  * Converts a simplified Solana transaction object to an AddressAction object, focusing on basic SOL transfers.
//  * This version is HIGHLY LIMITED due to missing metadata and assumes the first instruction is the SOL transfer.
//  */
// function solanaTransactionToAddressAction(
//   transaction: SolTransaction,
//   from: string
// ): AnyAddressAction {
//   try {
//     const transactionHash = transaction.signatures
//       ? transaction.signatures[0].publicKey.toBase58()
//       : 'UNKNOWN'; // Assuming the first signature is the transaction hash
//     const blockTime = null; // Block time is unavailable in this simplified object

//     // Derive address from feePayer
//     const feePayer = transaction.feePayer;
//     const address = feePayer || null;
//     const addressStr = address?.toBase58();

//     // Basic Asset Structure
//     const solAsset = {
//       id: 'solana',
//       asset_code: 'SOL',
//       decimals: 9,
//       icon_url: 'https://token-icons.s3.us-east-1.amazonaws.com/solana.png', // Replace with a real URL
//       name: 'Solana',
//       price: null,
//       symbol: 'SOL',
//       type: 'asset',
//       is_displayable: true,
//       is_verified: true,
//     };

//     let recipient = null;
//     let sender = null;
//     let actionType: 'send' | 'execute' = 'execute'; // Cannot accurately determine without balance data
//     let quantity = '0';

//     // Attempt to extract recipient from the first instruction (HIGHLY unreliable)
//     if (transaction.instructions && transaction.instructions.length > 0) {
//       const firstInstruction = transaction.instructions[0];
//       if (firstInstruction.keys && firstInstruction.keys.length >= 2) {
//         const signer = firstInstruction.keys.find(
//           (key) => key.isSigner
//         )?.pubkey;
//         recipient = firstInstruction.keys.find((key) => !key.isSigner)?.pubkey;

//         sender = signer;
//         actionType = 'send';
//         // quantity = 'UNKNOWN'; // Cannot determine amount accurately without balance data
//         // Attempt to extract amount from instruction data
//         if (firstInstruction.data && firstInstruction.data.length > 0) {
//           // Assuming the amount is encoded in the instruction data
//           // This is HIGHLY SPECIFIC to the SystemProgram transfer instruction
//           // and will likely NOT work for other transactions.
//           const amountLamports = firstInstruction.data
//             .slice(4)
//             .reduce((acc, val, idx) => acc + val * Math.pow(256, idx), 0);
//           quantity = amountLamports.toFixed();
//         }
//       }
//     }

//     const recipientStr = recipient?.toBase58();

//     return {
//       id: transactionHash,
//       datetime: blockTime
//         ? new Date(blockTime * 1000).toISOString()
//         : new Date().toISOString(), // Use current time if blockTime is unavailable
//       address: address?.toBase58() ?? from,
//       type: {
//         value: actionType,
//         display_value: actionType.charAt(0).toUpperCase() + actionType.slice(1), // "Others" if undetermined
//       },
//       transaction: {
//         chain: 'solana',
//         hash: String(transactionHash),
//         status: 'pending', // Cannot accurately determine without meta data
//         nonce: 0, // Solana doesn't use nonces like Ethereum
//         sponsored: false, // Assuming not sponsored
//         fee: null,
//         gasback: null,
//       },
//       label: recipientStr
//         ? {
//             type: 'to',
//             value: recipientStr,
//             display_value: { wallet_address: recipientStr },
//           }
//         : null,

//       // const recipientAddress = addressAction.label?.display_value.wallet_address;
//       content: {
//         transfers: {
//           outgoing: recipientStr
//             ? [
//                 {
//                   asset: { fungible: solAsset },
//                   quantity: quantity,
//                   price: null,
//                   recipient: recipientStr !== addressStr ? recipientStr : null,
//                   sender:
//                     sender?.toBase58() !== addressStr
//                       ? sender?.toBase58()
//                       : null,
//                 },
//               ]
//             : [],
//         },
//       },
//     };
//   } catch (error) {
//     return {
//       address: from,
//       content: null,
//       datetime: new Date().toISOString(),
//       id: 'todo',
//       label: {
//         type: 'contract',
//         display_value: {
//           contract_address: 'todo',
//         },
//         value: 'todo',
//       },
//       local: true,
//       transaction: {
//         chain: 'solana',
//         hash: 'todo: zero hash?',
//         status: 'pending', // Cannot accurately determine without meta data
//         nonce: 0, // Solana doesn't use nonces like Ethereum
//         sponsored: false, // Assuming not sponsored
//         fee: null,
//         gasback: null,
//       },
//       type: {
//         value: 'execute',
//         display_value: 'Execute',
//       },
//     };
//   }
// }
