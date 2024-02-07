import { client, createDomainHook } from 'defi-sdk';
import type { AddressNFT, AddressParams, Result } from 'defi-sdk';

type Payload = AddressParams & {
  currency: string;
  chain: string;
  contract_address: string;
  token_id: string;
};

const namespace = 'address';
const scope = 'nft-position';

export const useAddressNftPosition = createDomainHook<
  Payload,
  AddressNFT,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});

export async function getAddressNftPosition(payload: Payload) {
  return new Promise<Result<AddressNFT, typeof scope>>((resolve) => {
    const { unsubscribe } = client.cachedSubscribe<
      AddressNFT,
      typeof namespace,
      typeof scope
    >({
      namespace,
      body: {
        scope: [scope],
        payload,
      },
      cachePolicy: 'network-only',
      onData: (data) => {
        if (data.isDone) {
          resolve(data);
          unsubscribe?.();
        }
      },
    });
  });
}
