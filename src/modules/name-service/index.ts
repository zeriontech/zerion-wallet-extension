import { ZerionAPI } from '../zerion-api/zerion-api';
import type { Identity } from '../zerion-api/requests/wallets-meta';

const DOMAIN_PRIORITY: Record<Identity['provider'], number> = {
  ens: 0,
  lens: 1,
  ud: 2,
  unspecified: 3,
};

function identityComparator(a: Identity, b: Identity) {
  return DOMAIN_PRIORITY[a.provider] - DOMAIN_PRIORITY[b.provider];
}

export async function lookupAddressNames(address: string): Promise<string[]> {
  try {
    const response = await ZerionAPI.getWalletsMeta({ identifiers: [address] });
    return (
      response.data?.[0]?.identities
        .sort(identityComparator)
        .map(({ handle }) => handle) || []
    );
  } catch {
    return [];
  }
}

export async function lookupAddressName(
  address: string
): Promise<string | null> {
  const names = await lookupAddressNames(address);
  return names && names.length > 0 ? names[0] : null;
}

export async function resolveDomain(domain: string): Promise<string | null> {
  try {
    const response = await ZerionAPI.getWalletsMeta({ identifiers: [domain] });
    return response?.data?.[0]?.address || null;
  } catch {
    return null;
  }
}
