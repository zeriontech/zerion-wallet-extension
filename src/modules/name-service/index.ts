import { ensLookup } from './ens';
import { lensLookup } from './lens';

export type Registry = (address: string) => Promise<string | null>;

export const registries = [ensLookup, lensLookup];

export async function lookupAddressNames(address: string): Promise<string[]> {
  const addresses = await Promise.all(
    registries.map((lookup: Registry) => lookup(address))
  );
  return addresses.filter((address): address is string => address !== null);
}

export async function lookupAddressName(
  address: string
): Promise<string | null> {
  const names = await lookupAddressNames(address);
  return names.length > 0 ? names[0] : null;
}
