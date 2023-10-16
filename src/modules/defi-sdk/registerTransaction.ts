import { client } from 'defi-sdk';
import type { Chain } from '../networks/Chain';

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(hash: string, chain: Chain) {
  // TODO: Rewrite to rest api when backend is ready
  client.subscribe<object, typeof namespace, typeof scope>({
    method: 'get',
    namespace,
    body: {
      scope: [scope],
      payload: { hash, chain: chain.toString() },
    },
    onMessage: () => null,
  });
}
