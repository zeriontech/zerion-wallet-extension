import { useAddressNftPosition } from 'defi-sdk';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import type { Chain } from 'src/modules/networks/Chain';
import type { Brand } from 'src/shared/type-utils/Brand';

export type NftId = Brand<`${string}:${string}`, 'NftId'>;

export function parseNftId(id: NftId | string) {
  const [contract_address, token_id] = id.split(':');
  return { contract_address, token_id };
}
export function createNftId({
  contract_address,
  token_id,
}: {
  contract_address: string;
  token_id: string;
}): NftId {
  return `${contract_address}:${token_id}` as NftId;
}

export function useNftPosition({
  address,
  nftId,
  chain,
}: {
  address: string;
  nftId: NftId | null;
  chain: Chain | null;
}) {
  const client = useDefiSdkClient();
  const { currency } = useCurrency();
  const nftIdParams = nftId ? parseNftId(nftId) : null;

  const hasParams = Boolean(address && nftIdParams && chain);
  return useAddressNftPosition(
    {
      address: address || '',
      chain: chain?.toString() || '',
      contract_address: nftIdParams?.contract_address || '',
      token_id: nftIdParams?.token_id || '',
      currency,
    },
    { client, enabled: hasParams }
  );
}
