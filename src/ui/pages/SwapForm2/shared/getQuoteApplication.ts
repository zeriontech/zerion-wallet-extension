import type { ActionApplication } from 'src/modules/ethereum/transactions/addressAction';
import type { Quote2 } from 'src/shared/types/Quote';

export function getQuoteApplication({
  contractMetadata,
  contractAddress,
}: {
  contractMetadata: Pick<Quote2['contractMetadata'], 'id' | 'name' | 'iconUrl'>;
  contractAddress: string | null | undefined;
}): ActionApplication {
  return {
    address: contractAddress ?? '',
    dapp: {
      id: contractMetadata.id,
      name: contractMetadata.name,
      iconUrl: contractMetadata.iconUrl || null,
      url: null,
    },
  };
}
