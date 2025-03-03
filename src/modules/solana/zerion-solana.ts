import EventEmitter from 'events';
import { PublicKey } from '@solana/web3.js';
import type {
  SendOptions,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from '@solana/wallet-standard-features';
import { formatJsonRpcRequestPatched } from 'src/shared/custom-rpc/formatJsonRpcRequestPatched';
import { invariant } from 'src/shared/invariant';
import type { Ghost } from '@zeriontech/solana-wallet-standard';
import type { Connection } from '../ethereum/connection';
import { isSolanaAddress } from './shared';
import { solFromBase64, solToBase64 } from './transactions/create';
import type { SolTransactionResponse } from './transactions/SolTransactionResponse';
import { icon } from './icon';

export class ZerionSolana extends EventEmitter implements Ghost {
  name = 'Zerion';
  icon = icon;
  connection: Connection;
  publicKey: PublicKey | null;

  constructor(connection: Connection) {
    super();
    this.connection = connection;
    this.publicKey = null;

    connection.on(
      'ethereumEvent',
      ({ event, value }: { event: string; value: unknown }) => {
        if (event === 'accountsChanged' && Array.isArray(value)) {
          const address = value[0];
          if (address) {
            if (address === this.publicKey?.toBase58()) {
              // value hasn't changed
              return;
            } else if (!isSolanaAddress(address)) {
              return;
            } else {
              this.publicKey = new PublicKey(address);
            }
          } else {
            this.publicKey = null;
          }
          this.emit('accountChanged');
        }
      }
    );
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    const result = await this.connection.send(
      formatJsonRpcRequestPatched('sol_connect', [])
    );
    const address = (result as [string])[0];
    invariant(address, 'No address returned');
    const publicKey = new PublicKey(address);
    this.publicKey = publicKey;
    this.emit('connect');
    return { publicKey };
  }

  async disconnect(): Promise<void> {
    await this.connection.send(
      formatJsonRpcRequestPatched('sol_disconnect', [])
    );
    this.emit('disconnect');
  }

  signIn(_input?: SolanaSignInInput | undefined): Promise<SolanaSignInOutput> {
    throw new Error('signIn: Not Implemented');
  }

  signMessage(_message: Uint8Array): Promise<{ signature: Uint8Array }> {
    throw new Error('signMessage: Not Implemented');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    const txBase64 = solToBase64(transaction);
    const { tx } = await this.connection.send<SolTransactionResponse>(
      formatJsonRpcRequestPatched('sol_signTransaction', { txBase64 })
    );
    return solFromBase64(tx) as T;
  }

  signAllTransactions<T extends Transaction | VersionedTransaction>(
    _transactions: T[]
  ): Promise<T[]> {
    throw new Error('signAllTransactions: Not Implemented');
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    _options?: SendOptions | undefined
  ): Promise<{ signature: string }> {
    const txBase64 = solToBase64(transaction);
    const { signature } = await this.connection.send<SolTransactionResponse>(
      formatJsonRpcRequestPatched('sol_signAndSendTransaction', { txBase64 })
    );
    invariant(signature, 'signature is expected');
    return { signature };
  }
}
