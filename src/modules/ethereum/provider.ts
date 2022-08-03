import { JsonRpcProvider } from '@json-rpc-tools/provider';
import {
  formatJsonRpcRequest,
  IJsonRpcConnection,
  isJsonRpcError,
  JsonRpcRequest,
  RequestArguments,
} from '@json-rpc-tools/utils';

function accountsEquals(arr1: string[], arr2: string[]) {
  // it's okay to perform search like this because `accounts`
  // always has at most one element
  return (
    arr1.length === arr2.length && arr1.every((item) => arr2.includes(item))
  );
}

export class EthereumProvider extends JsonRpcProvider {
  accounts: string[];
  chainId: string;
  isZerionWallet: boolean;
  // enable
  constructor(connection: IJsonRpcConnection) {
    super(connection);
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
        console.log('emitting ethereumEvent', event, value); // eslint-disable-line no-console
        this.events.emit(event, value);
      }
    );

    this.request({ method: 'getChainId' }).then((chainId: string) => {
      this.chainId = chainId;
    });
    this.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      this.accounts = accounts;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async request<Result = any, Params = any>(
    request: RequestArguments<Params>,
    context?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<Result> {
    return this.getRequestPromise(
      formatJsonRpcRequest(request.method, request.params || []),
      context
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getRequestPromise<Result = any, Params = any>(
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
}
