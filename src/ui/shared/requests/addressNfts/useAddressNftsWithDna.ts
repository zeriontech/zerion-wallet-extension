import type { AddressNFT, AddressParams } from 'defi-sdk';
import { createDomainHook, mergeList } from 'defi-sdk';

// type Options<
//   Payload,
//   Namespace extends string,
//   ScopeName extends string
// > = Omit<HookOptions<Namespace, ScopeName>, 'body' | 'socketNamespace'> & {
//   payload: Payload;
// };

export type NFTSortedByParamType =
  | 'floor_price_low'
  | 'last_price_low'
  | 'floor_price_high'
  | 'last_price_high'
  | 'created_recently'
  | 'created_long_ago';

type Payload = AddressParams & {
  currency: string;
  nft_limit?: number;
  nft_offset?: number;
  sorted_by?: NFTSortedByParamType;
  // mode?: NFTDisplayMode;
  contract_addresses?: string[] | null;
};

const namespace = 'address';
const scope = 'nft';

export const useAddressNfts = createDomainHook<
  Payload,
  AddressNFT[],
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
  getId: (addressNft: AddressNFT) => addressNft.id,
  mergeStrategy: mergeList,
});

// export function useAddressNftsWithDna({
//   payload,
//   ...options
// }: Options<Payload, 'address', 'nft'>) {
//   const [paginatedData, loadMore] = useAddressNfts({
//     ...options,
//     payload,
//   });
//
//   const [dnaCollectionData] = useAddressNfts({
//     ...options,
//     payload: useMemo(() => {
//       return {
//         ...payload,
//         contract_addresses: [DNA_NFT_COLLECTION_ADDRESS],
//       };
//     }, [payload]),
//   });
//
//   // we need to pin dna collection in the beginning of nft list
//   const mergedNftData = useMemo(() => {
//     if (
//       payload.contract_addresses?.includes(DNA_NFT_COLLECTION_ADDRESS) ||
//       !payload.contract_addresses?.length
//     ) {
//       const dataIsReady =
//         dnaCollectionData.status === 'ok' && paginatedData.status === 'ok';
//       return {
//         ...paginatedData,
//         status: dataIsReady ? ('ok' as const) : ('fetching' as const),
//         data: dataIsReady
//           ? [
//               ...(dnaCollectionData.data || []),
//               ...(paginatedData.data?.filter(
//                 (item) =>
//                   item.asset.contract_address !== DNA_NFT_COLLECTION_ADDRESS
//               ) || []),
//             ]
//           : null,
//       };
//     }
//     return paginatedData;
//   }, [paginatedData, dnaCollectionData, payload.contract_addresses]);
//
//   return [mergedNftData, loadMore] as const;
// }
