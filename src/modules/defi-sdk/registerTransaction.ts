import { client } from 'defi-sdk';

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(hash: string, chain: string) {
  // TODO: Rewrite to rest api when backend is ready
  client.cachedSubscribe<object, typeof namespace, typeof scope>({
    method: 'get',
    namespace,
    body: {
      scope: [scope],
      payload: { hash, chain },
    },
    onData: () => null,
  });
}
