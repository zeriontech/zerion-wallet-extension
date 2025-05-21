import type {
  TransactionInstruction} from '@solana/web3.js';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram
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
): Promise<Transaction> {
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
    const lamports = BigInt(Number(formState.tokenValue) * 1e9);
    tx.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );
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

    console.log({ toTokenAccountInfo });

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

  return tx;
}
