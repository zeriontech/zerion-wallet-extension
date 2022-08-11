import { JsonRpcProvider } from '@json-rpc-tools/provider';
import {
  formatJsonRpcRequest,
  isJsonRpcError,
  JsonRpcPayload,
  JsonRpcRequest,
  RequestArguments,
} from '@json-rpc-tools/utils';
import type { Connection } from './connection';

function accountsEquals(arr1: string[], arr2: string[]) {
  // it's okay to perform search like this because `accounts`
  // always has at most one element
  return (
    arr1.length === arr2.length && arr1.every((item) => arr2.includes(item))
  );
}

async function fetchInitialState(connection: Connection) {
  return Promise.all([
    connection.send<string>(formatJsonRpcRequest('getChainId', [])),
    connection.send<string[]>(formatJsonRpcRequest('eth_accounts', [])),
  ]).then(([chainId, accounts]) => ({ chainId, accounts }));
}

export class EthereumProvider extends JsonRpcProvider {
  accounts: string[];
  chainId: string;
  isZerionWallet: boolean;
  connection: Connection;
  _openPromise: Promise<void> | null = null;

  constructor(connection: Connection) {
    super(connection);
    this.connection = connection;
    this.shimLegacy();
    this.chainId = '0x1';
    this.accounts = [];
    this.isZerionWallet = true;

    connection.on(
      'ethereumEvent',
      ({ event, value }: { event: string; value: unknown }) => {
        if (event === 'chainChanged' && typeof value === 'string') {
          this.chainId = value;
        }
        if (event === 'accountsChanged' && Array.isArray(value)) {
          // it's okay to perform search like this because `this.accounts`
          // always has at most one element
          if (accountsEquals(value, this.accounts)) {
            // Do not emit accountChanged because value hasn't changed
            return;
          } else {
            this.accounts = value;
          }
        }
        this.events.emit(event, value);
      }
    );

    this.open();
  }

  on(event: string, listener: (params: unknown) => unknown) {
    super.on(event, listener);
    return this;
  }

  private async _prepareState() {
    return fetchInitialState(this.connection).then(({ chainId, accounts }) => {
      this.chainId = chainId;
      this.accounts = accounts;
    });
  }

  public async request(
    request: RequestArguments,
    context?: unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    if (request.method === 'eth_chainId') {
      return Promise.resolve(this.chainId);
    }
    if (request.method === 'eth_accounts') {
      return Promise.resolve(this.accounts);
    }
    return this._getRequestPromise(
      formatJsonRpcRequest(request.method, request.params || []),
      context
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _getRequestPromise<Result = any, Params = any>(
    request: JsonRpcRequest<Params>,
    _context?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<Result> {
    if (!this.connection.connected) {
      await this.open();
    }
    return new Promise((resolve, reject) => {
      this.events.once(`${request.id}`, (response) => {
        if (isJsonRpcError(response)) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      this.connection.send(request);
    });
  }

  // Taken from Rabby
  // shim to matamask legacy api
  sendAsync = (
    payload: unknown,
    callback: (error: null | Error, result: unknown) => void
  ) => {
    if (Array.isArray(payload)) {
      return Promise.all(
        payload.map(
          (item) =>
            new Promise((resolve) => {
              this.sendAsync(item, (_err, res) => {
                // ignore error
                resolve(res);
              });
            })
        )
      ).then((result) => callback(null, result));
    }
    const { method, params, ...rest } = payload as JsonRpcRequest;
    this.request({ method, params })
      .then((result) => callback(null, { ...rest, method, result }))
      .catch((error) => callback(error, { ...rest, method, error }));
  };

  shimLegacy() {
    const legacyMethods = [
      ['enable', 'eth_requestAccounts'],
      ['net_version', 'net_version'],
    ];

    for (const [_method, method] of legacyMethods) {
      // @ts-ignore
      this[_method] = () => this.request({ method });
    }
  }

  isConnected() {
    return this.connection.connected;
  }

  private async _internalOpen(connection: Connection) {
    if (this.connection === connection && this.connection.connected) return;
    if (this.connection.connected) this.close();
    this.connection = connection; // this.setConnection();
    await Promise.all([this.connection.open(), this._prepareState()]);
    this.connection.on('payload', (payload: JsonRpcPayload) =>
      this.onPayload(payload)
    );
    this.connection.on('close', () => {
      this.events.emit('disconnect');
    });
    this.events.emit('connect', { chainId: this.chainId });
  }

  open(connection: Connection = this.connection) {
    if (!this._openPromise) {
      this._openPromise = this._internalOpen(connection);
    }
    return this._openPromise;
  }
}
