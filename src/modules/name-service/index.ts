import { ensLookup } from './ens';
import { lensLookup } from './lens';
import { unstoppableDomainsLookup } from './unstoppableDomains';

export type Registry = (address: string) => Promise<string | null>;

export const registries = [ensLookup, lensLookup, unstoppableDomainsLookup];

export async function lookupAddressNames(address: string): Promise<[string]> {
  const addresses = await Promise.all(
    registries.map((lookup: Registry) => lookup(address))
  );
  return addresses.filter((address: string | null) => address !== null);
}
