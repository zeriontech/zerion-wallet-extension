import { UnsLocation, Resolution } from '@unstoppabledomains/resolution';

export async function unstoppableDomainsLookup(
  address: string
): Promise<string | null> {
  const resolution = new Resolution();
  const name = await resolution.reverse(address, {
    location: UnsLocation.Layer2,
  });
  return name;
}
