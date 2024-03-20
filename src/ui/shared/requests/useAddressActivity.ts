import type { CachePolicy } from 'defi-sdk';
import { createDomainHook, client } from 'defi-sdk';

const namespace = 'address';
const scope = 'activity';

type Params = { addresses: string[] };
type Response = Record<string, { address: string; active: boolean }>;

export const useAddressActivity = createDomainHook<
  Params,
  Response,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});

export async function getAddressActivity(
  params: Params,
  options?: { cachePolicy?: CachePolicy }
) {
  return new Promise<Response | null>((resolve, reject) => {
    const rejectTimerId = setTimeout(
      () => reject(new Error(`Request timed out: getAddressActivity`)),
      10000
    );
    client.cachedSubscribe<Response, typeof namespace, typeof scope>({
      method: 'get',
      namespace,
      body: {
        scope: [scope],
        payload: params,
      },
      onData: ({ value }) => {
        if (value != null) {
          resolve(value);
          clearTimeout(rejectTimerId);
        }
      },
      ...options,
    });
  });
}
