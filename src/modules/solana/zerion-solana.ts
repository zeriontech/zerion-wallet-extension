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
import type { Connection } from '../ethereum/connection';
import type { Ghost } from './wallet-standard/window';
import { isSolanaAddress } from './shared';
import { solToBase64 } from './transactions/create';

export class ZerionSolana extends EventEmitter implements Ghost {
  name = 'Zerion';
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
    console.log('solana connect', { address });
    return { publicKey: new PublicKey(address) };
    // throw new Error('connect: Not Implemented');
  }

  disconnect(): Promise<void> {
    throw new Error('disconnect: Not Implemented');
  }

  signIn(_input?: SolanaSignInInput | undefined): Promise<SolanaSignInOutput> {
    throw new Error('signIn: Not Implemented');
  }

  signMessage(_message: Uint8Array): Promise<{ signature: Uint8Array }> {
    throw new Error('signMessage: Not Implemented');
  }

  signTransaction<T extends Transaction | VersionedTransaction>(
    _transaction: T
  ): Promise<T> {
    throw new Error('signTransaction: Not Implemented');
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
    const base64 = solToBase64(transaction);
    return this.connection.send(
      formatJsonRpcRequestPatched('sol_signAndSendTransaction', [base64])
    );
  }
}
