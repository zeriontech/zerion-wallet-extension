import { JsonRpcProvider } from '@json-rpc-tools/provider';
import type { IJsonRpcConnection, JsonRpcRequest } from '@json-rpc-tools/utils';

export class EthereumProvider extends JsonRpcProvider {
  // enable
  constructor(connection: IJsonRpcConnection) {
    super(connection);
    this.shimLegacy();
    connection.on(
      'ethereumEvent',
      ({ event, value }: { event: string; value: unknown }) => {
        console.log('emitting ethereumEvent', event, value); // eslint-disable-line no-console
        this.events.emit(event, value);
      }
    );
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
