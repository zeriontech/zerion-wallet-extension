import EventEmitter from 'events';
import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from '@solana/wallet-standard-features';
import type {
  SendOptions,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import type { Ghost } from '@zeriontech/solana-wallet-standard';
import { formatJsonRpcRequestPatched } from 'src/shared/custom-rpc/formatJsonRpcRequestPatched';
import { invariant } from 'src/shared/invariant';
import { base64ToUint8Array, uint8ArrayToBase64 } from '../crypto/convert';
import type { Connection } from '../ethereum/connection';
import { icon } from './icon';
import { isSolanaAddress } from './shared';
import { solFromBase64, solToBase64 } from './transactions/create';
import type { SolSignTransactionResult } from './transactions/SolTransactionResponse';

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

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    const signature = await this.connection.send<string>(
      formatJsonRpcRequestPatched('sol_signMessage', {
        messageSerialized: uint8ArrayToBase64(message),
      })
    );
    return { signature: base64ToUint8Array(signature) };
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    const txBase64 = solToBase64(transaction);
    const { tx } = await this.connection.send<SolSignTransactionResult>(
      formatJsonRpcRequestPatched('sol_signTransaction', { txBase64 })
    );
    return solFromBase64(tx) as T;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    const base64Txs = transactions.map((tx) => solToBase64(tx));
    const results = await this.connection.send<SolSignTransactionResult[]>(
      formatJsonRpcRequestPatched('sol_signAllTransactions', { base64Txs })
    );
    return results.map((result) => solFromBase64(result.tx)) as T[];
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    _options?: SendOptions | undefined
  ): Promise<{ signature: string }> {
    const txBase64 = solToBase64(transaction);
    const { signature } = await this.connection.send<SolSignTransactionResult>(
      formatJsonRpcRequestPatched('sol_signAndSendTransaction', { txBase64 })
    );
    invariant(signature, 'signature is expected');
    return { signature };
  }
}
