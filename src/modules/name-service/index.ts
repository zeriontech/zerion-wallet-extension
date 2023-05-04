import { normalizeAddress } from 'src/shared/normalizeAddress';
import { requestWithCache } from 'src/ui/shared/requests/requestWithCache';
import { ensLookup, ensResolve } from './ens';
import { lensLookup, lensResolve } from './lens';
import { udLookup, udResolve } from './ud';

export type Registry = (address: string) => Promise<string | null>;

export const registries = [ensLookup, lensLookup, udLookup];
export const resolvers = [ensResolve, lensResolve, udResolve];

async function lookupAddressNames(address: string): Promise<string[]> {
  const addresses = await Promise.allSettled(
    registries.map((lookup: Registry) => lookup(address))
  ).then((results) => {
    const fulfilled = results.filter(
      (res) => res.status === 'fulfilled'
    ) as PromiseFulfilledResult<string>[];
    return fulfilled.map((res) => res.value);
  });
  return addresses.filter((address): address is string => address !== null);
}

export async function lookupAddressName(
  address: string
): Promise<string | null> {
  const names = await requestWithCache(
    `lookupAddressName ${address}`,
    lookupAddressNames(address)
  );
  return names.length > 0 ? names[0] : null;
}

export async function resolveDomain(domain: string): Promise<string | null> {
  const addresses = await Promise.allSettled(
    resolvers.map((resolve: Registry) => {
      try {
        return resolve(domain);
      } catch {
        return null;
      }
    })
  ).then((results) => {
    const fulfilled = results.filter(
      (res) => res.status === 'fulfilled'
    ) as PromiseFulfilledResult<string>[];
    return fulfilled.map((res) => res.value);
  });
  const resolvedAddress = addresses.filter(
    (address): address is string => address !== null
  )[0];
  return resolvedAddress ? normalizeAddress(resolvedAddress) : null;
}
