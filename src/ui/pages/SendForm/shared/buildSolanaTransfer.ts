import type { TransactionInstruction } from '@solana/web3.js';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getMint,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import type { AddressPosition } from 'defi-sdk';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { Networks } from 'src/modules/networks/Networks';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { getAddress } from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import { commonToBase } from 'src/shared/units/convert';
import type { SendFormState } from './SendFormState';

export async function buildSolanaTransfer(
  from: string,
  formState: SendFormState,
  position: AddressPosition | EmptyAddressPosition,
  network: NetworkConfig
): Promise<{ tx: Transaction; fee: number | null }> {
  invariant(formState.to, 'Recipient address is missing');
  invariant(formState.tokenAssetCode, 'Token mint address is missing');
  invariant(formState.tokenValue, 'Token amount is missing');

  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(formState.to);

  const tx = new Transaction();
  tx.feePayer = fromPubkey;

  const rpcUrl = Networks.getNetworkRpcUrlInternal(network);
  const connection = new Connection(rpcUrl);
  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;

  const isNativeAsset = Networks.isNativeAsset(position.asset, network);
  if (isNativeAsset) {
    // Convert SOL (in lamports)
    let lamports = BigInt(Number(formState.tokenValue) * 1e9);
    const isSendingMax =
      position.quantity != null && lamports === BigInt(position.quantity);
    tx.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );
    if (isSendingMax) {
      const simulatedTx = await connection.simulateTransaction(tx);
      const computeUnits = simulatedTx.value.unitsConsumed ?? 100_000;
      const adjustedUnits = Math.max(
        Math.min(1_400_000, computeUnits * 1.2),
        500
      );
      const tempTx = new Transaction();
      tempTx.feePayer = fromPubkey;
      tempTx.recentBlockhash = latestBlockhash.blockhash;
      tempTx.add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: adjustedUnits }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: Math.floor((100_000 / adjustedUnits) * 1000_000),
        })
      );
      const estimatedFee = await tempTx.getEstimatedFee(connection);
      if (estimatedFee != null && estimatedFee > 0) {
        lamports = lamports - BigInt(estimatedFee);
        // Replace the transfer instruction with the adjusted amount
        tx.instructions = [
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          }),
        ];
      }
    }
  } else {
    const tokenAddressInChain = getAddress({
      asset: position.asset,
      chain: createChain(network.id),
    });
    invariant(
      tokenAddressInChain,
      'Token implementation must be a solana address'
    );
    const mint = new PublicKey(tokenAddressInChain);
    const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);

    const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);

    const mintInfo = await getMint(connection, mint);

    const { decimals } = mintInfo;
    const amount = commonToBase(formState.tokenValue, decimals);

    const instructions: TransactionInstruction[] = [];

    if (!toTokenAccountInfo) {
      // If the recipient has never received this token, we must perform an additional step
      instructions.push(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAccount,
          toPubkey,
          mint
        )
      );
    }
    instructions.push(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        BigInt(amount.toFixed())
      )
    );

    tx.add(...instructions);
  }
  const simulatedTransaction = await connection.simulateTransaction(tx);
  const computeUnitsEsimation =
    simulatedTransaction.value.unitsConsumed ?? 100_000;
  const adjustedComputeUnits = Math.max(
    Math.min(1_400_000, computeUnitsEsimation * 1.2),
    500
  );

  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: adjustedComputeUnits,
    })
  ).add(
    // priorityFee
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.floor((100_000 / adjustedComputeUnits) * 1000_000),
    })
  );

  const fee = await tx.getEstimatedFee(connection);

  return { tx, fee };
}
